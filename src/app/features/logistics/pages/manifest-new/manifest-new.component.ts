import { takeUntil } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { Component, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogisticsPage } from '../../page';
import { LogisticsPending } from '../../pending';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { MovementRootComponent } from '../../components/movement-root/movement-root.component';
import { PageHeading, Feedback, Spinner, attemptFormValidation } from '../../../../shared/ui/page';
import { form, message, label } from '../../rules';
import { Entity, Field, MovementDetail } from '../../models';
import { UnsavedChanges } from '../../../../shared/ui/unsaved-changes';
import { confirm } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { StepperComponent, StepperStep } from '../../../../shared/ui/stepper/stepper.component';
@Component({
  selector: 'tc-logistics-manifest-new',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    LookupComponent,
    FieldsComponent,
    PendingRequestsComponent,
    MovementRootComponent,
    PageHeading,
    Feedback,
    Spinner,
    StepperComponent,
  ],
  templateUrl: './manifest-new.component.html',
  styleUrl: './manifest-new.component.scss',
})
export class ManifestNewComponent extends LogisticsPage {
  readonly unsaved = inject(UnsavedChanges);
  readonly confirmationDialog = inject(Dialog);
  readonly pending = inject(LogisticsPending);
  readonly root = viewChild(MovementRootComponent);
  readonly step = signal(1);
  readonly steps: readonly StepperStep[] = [
    { label: 'Contexto' },
    { label: 'Raíces' },
    { label: 'Referencias' },
    { label: 'Revisión' },
  ];
  readonly direction = signal<'forward' | 'backward'>('forward');
  readonly saved = signal<
    { movement: Entity; root: string; allocation: string; line: string; reference: string }[]
  >([]);
  readonly submitting = signal(false);
  readonly yardControl = new FormControl('', Validators.required);
  private requirementType = '';
  fields: Field[] = [
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      choices: ['OUTBOUND', 'RETURN', 'TRANSFER'],
      required: true,
    },
    {
      key: 'carrierUuid',
      label: 'Transportista',
      type: 'lookup',
      resource: 'party-options',
      required: true,
    },
    { key: 'destinationYardUuid', label: 'Patio de destino' },
    {
      key: 'destinationSiteUuid',
      label: 'Sitio de destino',
      type: 'lookup',
      resource: 'site-options',
    },
    {
      key: 'destinationCustodianUuid',
      label: 'Custodio externo',
      type: 'lookup',
      resource: 'party-options',
      params: { purpose: 'CUSTODIAN' },
    },
    {
      key: 'destinationCustodyMode',
      label: 'Modalidad de custodia',
      type: 'select',
      choices: ['STORAGE', 'RENTAL', 'REPAIR'],
      required: true,
    },
    { key: 'reason', label: 'Motivo del movimiento', type: 'textarea', required: true, max: 1000 },
    { key: 'sourceReference', label: 'Referencia de origen', required: true, max: 500 },
    { key: 'ownerAuthorizationReference', label: 'Autorización del propietario', max: 500 },
  ];
  readonly form = form(this.fields, { type: 'OUTBOUND', destinationCustodyMode: 'STORAGE' });
  readonly candidate = signal('');
  readonly requirement = signal('');
  private storage = 'tracecore.logistics.draft';
  private restored = false;
  get visibleFields(): Field[] {
    const type = this.form.controls['type']?.value;
    return this.fields.filter((field) => {
      if (field.key === 'destinationYardUuid') return type === 'RETURN' || type === 'TRANSFER';
      if (field.key === 'destinationSiteUuid' || field.key === 'destinationCustodianUuid')
        return type === 'OUTBOUND';
      return true;
    });
  }
  context(): Record<string, string> {
    return {
      ...this.form.getRawValue(),
      yardUuid: this.yard,
      transitCustodianUuid: this.form.getRawValue()['carrierUuid'],
    };
  }
  dirty() {
    return this.form.dirty || !!this.root()?.dirty();
  }
  override ngOnInit() {
    super.ngOnInit();
    this.yardControl.setValue(this.yard);
    this.syncDestinationRequirements();
    this.form.valueChanges.pipe(takeUntil(this.ended)).subscribe(() => {
      this.syncDestinationRequirements();
      this.persist();
    });
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => {
      this.form.reset();
      this.saved.set([]);
      sessionStorage.removeItem(this.storage);
    });
  }
  protected override async afterLoad() {
    if (this.restored) return;
    this.restored = true;
    try {
      const d = JSON.parse(sessionStorage.getItem(this.storage) ?? 'null');
      if (d?.actor === this.session.user()?.uuid) {
        this.form.patchValue(d.form);
        this.saved.set(d.saved ?? []);
        this.gate = d.gate ?? '';
        this.freezeContext();
        this.yard = d.yard || this.yard;
        this.yardControl.setValue(this.yard);
      }
    } catch {
      sessionStorage.removeItem(this.storage);
    }
  }
  persist() {
    if (!this.session.valid()) return;
    sessionStorage.setItem(
      this.storage,
      JSON.stringify({
        actor: this.session.user()?.uuid,
        yard: this.yard,
        form: this.form.getRawValue(),
        saved: this.saved(),
        gate: this.gate,
      }),
    );
  }
  setYard(v: string) {
    if (this.saved().length || this.root()?.dirty()) {
      this.error.set('Conserva o retira explícitamente la carga antes de cambiar contexto.');
      return;
    }
    this.yard = v;
    this.yardControl.setValue(v);
    this.persist();
  }
  addCreated(d: MovementDetail) {
    this.add(d);
  }
  async addCandidate() {
    if (!this.candidate()) return;
    try {
      this.add(await this.api.get<MovementDetail>('/movement-options/' + this.candidate()));
    } catch (e) {
      this.error.set(message(e));
    }
  }
  add(d: MovementDetail) {
    const v = this.context(),
      m = d.movement;
    const roots = d.items.filter((i) => i.assetUuid === i.rootAssetUuid);
    if (
      d.logisticsManaged ||
      m.state !== 'DRAFT' ||
      roots.length !== 1 ||
      m.type !== v['type'] ||
      m.transitCustodianUuid !== v['carrierUuid']
    ) {
      this.error.set('Movimiento incompatible, ya vinculado o con varias raíces.');
      return;
    }
    if (this.saved().some((r) => r.movement.uuid === m.uuid) || this.saved().length >= 100) return;
    if (
      (m.sourceYardUuid && m.sourceYardUuid !== this.yard) ||
      (m.destinationYardUuid && m.destinationYardUuid !== v['destinationYardUuid']) ||
      (m.destinationSiteUuid && m.destinationSiteUuid !== v['destinationSiteUuid'])
    ) {
      this.error.set('La ruta no coincide con el contexto elegido.');
      return;
    }
    const first = this.saved()[0]?.movement;
    if (
      first &&
      [
        'sourceYardUuid',
        'sourceSiteUuid',
        'destinationYardUuid',
        'destinationSiteUuid',
        'transitCustodianUuid',
        'destinationCustodianUuid',
        'destinationCustodyMode',
      ].some((k) => first[k] !== m[k])
    ) {
      this.error.set('La ruta o la custodia no coincide con las otras raíces.');
      return;
    }
    this.saved.update((rows) => [
      ...rows,
      { movement: m, root: roots[0].assetUuid!, allocation: '', line: '', reference: '' },
    ]);
    this.form.markAsDirty();
    this.freezeContext();
    this.persist();
  }
  async remove(id: string) {
    if (
      !(await confirm(
        this.confirmationDialog,
        'Retirar movimiento de la preparación',
        'El movimiento permanece guardado en inventario.',
      ))
    )
      return;
    this.saved.update((rows) => rows.filter((r) => r.movement.uuid !== id));
    this.freezeContext();
    this.persist();
  }
  setLoad(id: string, key: 'allocation' | 'line' | 'reference', value: string) {
    this.saved.update((rows) =>
      rows.map((r) => (r.movement.uuid === id ? { ...r, [key]: value } : r)),
    );
    this.form.markAsDirty();
    this.persist();
  }
  async go(n: number) {
    if (
      this.step() === 2 &&
      this.root()?.dirty() &&
      !(await this.unsaved.confirmDiscard(
        true,
        'Se descartará la captura de la raíz que aún no se ha guardado.',
      ))
    )
      return;
    if (n > this.step()) {
      if (!(await this.validateStage(this.step()))) return;
      n = Math.min(n, this.step() + 1);
    }
    if (n > this.step()) this.direction.set('forward');
    else if (n < this.step()) this.direction.set('backward');
    this.step.set(n);
    setTimeout(() => {
      document.querySelector<HTMLElement>('.wizard-step-heading')?.focus();
    }, 0);
  }
  private async validateStage(stage: number): Promise<boolean> {
    if (stage === 1) {
      const required = this.fields
        .filter((field) => field.required)
        .map((field) => this.form.get(field.key)!);
      return attemptFormValidation(
        this.form,
        [this.yardControl, ...required],
        document.querySelector<HTMLElement>('section.panel'),
      );
    }
    if (stage === 2) {
      if (this.saved().length) return true;
      const root = this.root();
      if (root?.form.invalid) attemptFormValidation(root.form, [root.form.get('assetUuid')!], document.querySelector<HTMLElement>('tc-logistics-movement-root form'));
      this.error.set('Agrega y guarda al menos una raíz antes de continuar.');
      return false;
    }
    if (stage === 3) {
      if (this.saved().length) return true;
      this.error.set('Agrega al menos una raíz antes de revisar el manifiesto.');
      return false;
    }
    return true;
  }
  next() {
    void this.go(Math.min(4, this.step() + 1));
  }
  prev() {
    void this.go(Math.max(1, this.step() - 1));
  }
  async save() {
    if (this.submitting()) return;
    if (!attemptFormValidation(this.form, [this.form], document.querySelector<HTMLElement>('section.panel')) || !this.saved().length) {
      this.error.set('Completa el contexto y selecciona al menos una raíz.');
      return;
    }
    try {
      if (!this.can('LOGISTICS_MANAGE')) throw new Error('Falta LOGISTICS_MANAGE.');
      this.submitting.set(true);
      const r = await this.pending.create<Entity>('MANIFEST', '/manifests', {
        requestKey: crypto.randomUUID(),
        gateUuid: this.gate || null,
        loads: this.saved().map((r) => ({
          movementUuid: r.movement.uuid,
          rootAllocationUuid: r.allocation || null,
          orderLineUuid: r.line || null,
          requirementReference: r.reference || null,
        })),
      });
      this.form.markAsPristine();
      this.saved.set([]);
      sessionStorage.removeItem(this.storage);
      void this.router.navigate(['/logistica/manifiestos', r.uuid]);
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.submitting.set(false);
    }
  }
  setGate(v: string) {
    this.gate = v;
    this.form.markAsDirty();
    this.persist();
  }
  private syncDestinationRequirements(): void {
    const type = this.form.getRawValue()['type'];
    if (type === this.requirementType) return;
    const previousType = this.requirementType;
    this.requirementType = type;
    if (previousType) {
      if (type === 'OUTBOUND') {
        this.form.get('destinationYardUuid')?.setValue('', { emitEvent: false });
      } else {
        this.form.get('destinationSiteUuid')?.setValue('', { emitEvent: false });
        this.form.get('destinationCustodianUuid')?.setValue('', { emitEvent: false });
      }
    }
    const conditional = new Set(
      type === 'OUTBOUND'
        ? ['destinationSiteUuid', 'destinationCustodianUuid']
        : ['destinationYardUuid'],
    );
    const alwaysRequired = new Set(['type', 'carrierUuid', 'destinationCustodyMode', 'reason', 'sourceReference']);
    this.fields = this.fields.map((field) => ({
      ...field,
      required: alwaysRequired.has(field.key) || conditional.has(field.key),
    }));
    for (const key of ['destinationSiteUuid', 'destinationCustodianUuid', 'destinationYardUuid']) {
      const field = this.fields.find((item) => item.key === key)!;
      const control = this.form.get(key)!;
      control.setValidators([
        Validators.maxLength(field.max ?? 1000),
        ...(conditional.has(key) ? [Validators.required] : []),
      ]);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }
  freezeContext() {
    for (const f of this.fields) {
      if (f.key === 'folio') continue;
      const c = this.form.get(f.key);
      if (this.saved().length) c?.disable({ emitEvent: false });
      else c?.enable({ emitEvent: false });
    }
  }
  gate = '';
}
