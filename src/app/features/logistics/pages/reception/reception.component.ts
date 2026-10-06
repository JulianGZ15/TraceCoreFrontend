import { takeUntil } from 'rxjs';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogisticsPage } from '../../page';
import { LogisticsPending } from '../../pending';
import { Entity, Summary, Check, Row, Field } from '../../models';
import { form, message, label } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { RecordsComponent } from '../../shared/records/records.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
interface SelectedRoot {
  uuid: string;
  form: FormGroup;
  pieces: FormArray;
}
@Component({
  selector: 'tc-logistics-reception',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldsComponent,
    LookupComponent,
    RecordsComponent,
    PendingRequestsComponent,
    PageHeading,
    Feedback,
    Pagination,
  ],
  templateUrl: './reception.component.html',
  styleUrl: './reception.component.scss',
})
export class ReceptionComponent extends LogisticsPage {
  protected override resourceChanged() {
    this.form.reset();
    this.chosen.set([]);
  }
  override mode = 'manifest';
  readonly pending = inject(LogisticsPending);
  readonly chosen = signal<SelectedRoot[]>([]);
  readonly saving = signal(false);
  readonly selecting = signal(false);
  readonly conditions = ['UNKNOWN', 'NEW', 'SERVICEABLE', 'DAMAGED', 'UNDER_REPAIR', 'SCRAPPED'];
  override columns = [
    { key: 'assetUuid', label: 'Raíz' },
    { key: 'grossWeightKgExact', label: 'Peso kg' },
  ];
  readonly fields: Field[] = [
    { key: 'receiverName', label: 'Nombre de quien recibe', required: true, max: 150 },
    { key: 'reference', label: 'Referencia de entrega', required: true, max: 500 },
    {
      key: 'missingObservation',
      label: 'Observación de raíces pendientes',
      type: 'textarea',
      max: 1000,
    },
  ];
  readonly form = form([
    ...this.fields,
    { key: 'receiverPartyUuid', label: 'Tercero receptor' },
    { key: 'receiverContactUuid', label: 'Contacto receptor' },
    { key: 'evidenceUuid', label: 'Evidencia', required: true },
  ]);
  dirty() {
    return this.form.dirty || this.chosen().some((r) => r.form.dirty);
  }
  protected override async afterLoad() {
    this.rows.set(
      await this.api.get<Row[]>(
        '/manifests/' + this.id + '/items',
        { offset: this.offset, limit: this.limit, rootsOnly: 'true', pendingOnly: 'true' },
        this.stop,
      ),
    );
  }
  pick(key: string, value: string) {
    this.form.get(key)?.setValue(value);
    this.form.markAsDirty();
    if (key === 'receiverPartyUuid') this.form.get('receiverContactUuid')?.setValue('');
  }
  async choose(row: Entity) {
    if (this.chosen().some((r) => r.uuid === row.rootAssetUuid) || this.selecting()) return;
    this.selecting.set(true);
    try {
      const items: Row[] = [];
      for (let off = 0; ; off += 100) {
        const page = await this.api.get<Row[]>(
          '/manifests/' + this.id + '/items',
          { rootAssetUuid: row.rootAssetUuid, offset: off, limit: 100, pendingOnly: 'true' },
          this.stop,
        );
        items.push(...page);
        if (page.length < 100) break;
      }
      if (!items.length)
        throw new Error('Esta raíz ya no está pendiente. Consulta datos actuales.');
      const pieces = new FormArray(
        items.map(
          ({ record, label }) =>
            new FormGroup({
              assetUuid: new FormControl(record.assetUuid, { nonNullable: true }),
              label: new FormControl(label, { nonNullable: true }),
              condition: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
              }),
              observation: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.maxLength(500)],
              }),
            }),
        ),
      );
      const form = new FormGroup({
        locationUuid: new FormControl('', { nonNullable: true }),
        pieces,
      });
      form.markAsDirty();
      this.chosen.update((rows) => [...rows, { uuid: row.rootAssetUuid!, form, pieces }]);
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.selecting.set(false);
    }
  }
  remove(id: string) {
    if (window.confirm('¿Descartar la captura de esta raíz?'))
      this.chosen.update((rows) => rows.filter((r) => r.uuid !== id));
  }
  apply(root: SelectedRoot, condition: string, observation: string) {
    if (!condition || !observation.trim()) return;
    for (const g of root.pieces.controls) g.patchValue({ condition, observation });
    root.form.markAsDirty();
  }
  async current() {
    try {
      this.summary.set(
        await this.api.get<Summary>('/manifests/' + this.id + '/summary', {}, this.stop),
      );
      await this.afterLoad();
      this.error.set(
        'Datos actuales consultados. Revisa las raíces y la captura antes de confirmar.',
      );
    } catch (e) {
      this.error.set(message(e));
    }
  }
  async save() {
    this.form.markAllAsTouched();
    for (const r of this.chosen()) r.form.markAllAsTouched();
    const s = this.summary();
    if (
      !s ||
      this.saving() ||
      this.selecting() ||
      this.form.invalid ||
      !this.chosen().length ||
      this.chosen().some((r) => r.form.invalid) ||
      !this.access.receive(s.manifest)
    )
      return;
    try {
      const v = this.form.getRawValue();
      if (
        s.rootCount - s.deliveredRootCount > this.chosen().length &&
        !v['missingObservation'].trim()
      )
        throw new Error('Describe las raíces todavía pendientes de entrega.');
      if (
        s.manifest.destinationYardUuid &&
        this.chosen().some((r) => !r.form.get('locationUuid')?.value)
      )
        throw new Error('Selecciona ubicación real por raíz.');
      if (!window.confirm('¿Confirmar la recepción física de todas las raíces seleccionadas?'))
        return;
      this.saving.set(true);
      const result = await this.pending.create<Entity>(
        'RECEIPT',
        '/manifests/' + this.id + '/receipts',
        {
          ...v,
          receiverPartyUuid: v['receiverPartyUuid'] || null,
          receiverContactUuid: v['receiverContactUuid'] || null,
          requestKey: crypto.randomUUID(),
          version: s.manifest.version,
          roots: this.chosen().map((r) => ({
            rootAssetUuid: r.uuid,
            locationUuid: s.manifest.destinationYardUuid ? r.form.get('locationUuid')?.value : null,
            pieces: r.pieces.getRawValue().map((p) => ({
              assetUuid: p.assetUuid,
              condition: p.condition,
              observation: p.observation,
            })),
          })),
        },
      );
      this.form.markAsPristine();
      this.chosen.set([]);
      void this.router.navigate(['/logistica/entregas', result.uuid]);
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.saving.set(false);
    }
  }
  override ngOnInit() {
    super.ngOnInit();
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => {
      this.chosen.set([]);
      this.form.reset();
    });
  }
}
