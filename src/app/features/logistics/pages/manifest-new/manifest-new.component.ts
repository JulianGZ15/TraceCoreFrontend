import { takeUntil } from 'rxjs';
import { Component, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogisticsPage } from '../../page';
import { LogisticsPending } from '../../pending';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { MovementRootComponent } from '../../components/movement-root/movement-root.component';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { form, message, label } from '../../rules';
import { Entity, Field, MovementDetail } from '../../models';
@Component({
  selector: 'tc-logistics-manifest-new',
  imports: [
    RouterLink,
    LookupComponent,
    FieldsComponent,
    PendingRequestsComponent,
    MovementRootComponent,
    PageHeading,
    Feedback,
  ],
  templateUrl: './manifest-new.component.html',
  styleUrl: './manifest-new.component.scss',
})
export class ManifestNewComponent extends LogisticsPage {
  readonly pending = inject(LogisticsPending);
  readonly root = viewChild(MovementRootComponent);
  readonly step = signal(1);
  readonly saved = signal<
    { movement: Entity; root: string; allocation: string; line: string; reference: string }[]
  >([]);
  readonly submitting = signal(false);
  readonly fields: Field[] = [
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
    { key: 'destinationYardUuid', label: 'Patio destino (TRANSFER/RETURN)' },
    {
      key: 'destinationSiteUuid',
      label: 'Sitio destino (OUTBOUND)',
      type: 'lookup',
      resource: 'site-options',
    },
    {
      key: 'destinationCustodianUuid',
      label: 'Custodio externo (OUTBOUND)',
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
    { key: 'folio', label: 'Folio del manifiesto', required: true, max: 80 },
  ];
  readonly form = form(this.fields, { type: 'OUTBOUND', destinationCustodyMode: 'STORAGE' });
  readonly candidate = signal('');
  readonly requirement = signal('');
  private storage = 'tracecore.logistics.draft';
  private restored = false;
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
    this.form.valueChanges.pipe(takeUntil(this.ended)).subscribe(() => this.persist());
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
  remove(id: string) {
    if (
      !window.confirm('¿Retirar de la preparación? El movimiento permanece guardado en inventario.')
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
  go(n: number) {
    if (
      this.step() === 2 &&
      this.root()?.dirty() &&
      !window.confirm('¿Descartar la captura de la raíz que aún no se ha guardado?')
    )
      return;
    this.step.set(n);
  }
  next() {
    this.go(Math.min(4, this.step() + 1));
  }
  async save() {
    if (this.submitting()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.saved().length) {
      this.error.set('Completa el contexto, el folio y al menos una raíz.');
      return;
    }
    try {
      if (!this.can('LOGISTICS_MANAGE')) throw new Error('Falta LOGISTICS_MANAGE.');
      this.submitting.set(true);
      const r = await this.pending.create<Entity>('MANIFEST', '/manifests', {
        requestKey: crypto.randomUUID(),
        folio: this.form.getRawValue()['folio'],
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
