import { takeUntil } from 'rxjs';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogisticsPage } from '../../page';
import { LogisticsPending } from '../../pending';
import { Entity, Summary, VerificationContext, Check, Row, Field } from '../../models';
import { form, message, label } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
@Component({
  selector: 'tc-logistics-verification',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldsComponent,
    PendingRequestsComponent,
    PageHeading,
    Feedback,
    Pagination,
  ],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.scss',
})
export class VerificationComponent extends LogisticsPage {
  protected override resourceChanged() {
    this.form.reset({ method: 'MANUAL' });
    this.context.set(null);
    this.observed.set([]);
    this.touched.set(false);
  }
  override ngOnInit() {
    super.ngOnInit();
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => {
      this.form.reset({ method: 'MANUAL' });
      this.context.set(null);
      this.observed.set([]);
      this.touched.set(false);
    });
  }
  override mode = 'manifest';
  readonly pending = inject(LogisticsPending);
  readonly context = signal<VerificationContext | null>(null);
  readonly observed = signal<string[]>([]);
  readonly touched = signal(false);
  readonly saving = signal(false);
  readonly fields: Field[] = [
    { key: 'method', label: 'Método', type: 'select', choices: ['MANUAL', 'RFID'], required: true },
    { key: 'sessionUuid', label: 'UUID de sesión RFID' },
    { key: 'reference', label: 'Referencia de comprobación', required: true, max: 1000 },
    { key: 'evidenceUuid', label: 'UUID de evidencia opcional' },
    { key: 'extra', label: 'Otros UUID de piezas observadas (uno por línea)', type: 'textarea' },
  ];
  readonly form = form(this.fields, { method: 'MANUAL' });
  dirty() {
    return this.form.dirty || this.touched();
  }
  protected override async afterLoad() {
    if (!this.dirty()) await this.fetchContext();
  }
  async fetchContext() {
    try {
      const method = this.form.getRawValue()['method'],
        session = this.form.getRawValue()['sessionUuid'];
      if (method === 'RFID' && !session) throw new Error('Indica la sesión RFID del responsable.');
      this.context.set(
        await this.api.get<VerificationContext>(
          '/manifests/' + this.id + '/verification-context',
          { sessionUuid: method === 'RFID' ? session : null },
          this.stop,
        ),
      );
    } catch (e) {
      this.error.set(message(e));
    }
  }
  toggle(id: string, yes: boolean) {
    this.observed.update((rows) =>
      yes ? [...new Set([...rows, id])] : rows.filter((v) => v !== id),
    );
    this.touched.set(true);
  }
  async current() {
    const draft = this.form.getRawValue();
    try {
      const s = await this.api.get<Summary>('/manifests/' + this.id + '/summary', {}, this.stop);
      this.summary.set(s);
      this.form.patchValue(draft);
      this.error.set(
        'Versiones actuales consultadas; conserva la captura y revisa antes de confirmar.',
      );
    } catch (e) {
      this.error.set(message(e));
    }
  }
  async save() {
    this.form.markAllAsTouched();
    const s = this.summary(),
      ctx = this.context();
    if (this.form.invalid || !s || !ctx || this.saving()) return;
    try {
      if (!this.can('LOGISTICS_CHECK')) throw new Error('Falta LOGISTICS_CHECK.');
      const v = this.form.getRawValue(),
        extra = v['extra']
          .split(/[\r\n,]+/)
          .map((x) => x.trim())
          .filter(Boolean);
      if (extra.some((v) => !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v)))
        throw new Error('Revisa los UUID adicionales.');
      if (v['method'] === 'RFID' && ctx.sessionUuid !== v['sessionUuid'])
        throw new Error('Consulta todos los recibos de la sesión actual.');
      this.saving.set(true);
      const result = await this.pending.create<Entity>(
        'CHECK',
        '/manifests/' + this.id + '/checks',
        {
          requestKey: crypto.randomUUID(),
          method: v['method'],
          sessionUuid: v['method'] === 'RFID' ? ctx.sessionUuid : null,
          eventUuids: v['method'] === 'RFID' ? ctx.eventUuids : [],
          observed: v['method'] === 'MANUAL' ? [...new Set([...this.observed(), ...extra])] : [],
          reference: v['reference'],
          evidenceUuid: v['evidenceUuid'] || null,
          version: s.manifest.version,
        },
      );
      this.form.markAsPristine();
      this.touched.set(false);
      void this.router.navigate(['/logistica/comprobaciones', result.uuid]);
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.saving.set(false);
    }
  }
}
