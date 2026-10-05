import { Component, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { FieldsComponent } from '../../shared/fields/fields.component';
import {
  Entity,
  Summary,
  CreditContext,
  Preview,
  Field,
  Row,
  ReceiptDetail,
  ReturnDetail,
  MovementDetail,
} from '../../models';
import { form, message, instant, exact } from '../../rules';
import { inject } from '@angular/core';
import { takeUntil } from 'rxjs';
import { CommercePending } from '../../pending';
@Component({
  selector: 'tc-commerce-billing-preview',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
    FieldsComponent,
  ],
  templateUrl: './billing-preview.component.html',
  styleUrl: './billing-preview.component.scss',
})
export class BillingPreviewComponent extends CommercePage {
  override title = 'Preparar corte de renta';
  readonly assignment = signal<Entity | null>(null);
  readonly preview = signal<Preview | null>(null);
  readonly pending = inject(CommercePending);
  readonly busy = signal(false);
  key = crypto.randomUUID();
  fields: Field[] = [
    { key: 'from', label: 'Inicio con offset', type: 'instant', required: true },
    { key: 'to', label: 'Fin con offset', type: 'instant', required: true },
  ];
  form = form(this.fields);
  dirty() {
    return this.form.dirty;
  }
  override async afterLoad() {
    const x = await this.api.get<Entity>('/assignments/' + this.id, {}, this.stop);
    this.assignment.set(x);
    const r = await this.api.get<Entity>('/rentals/' + x.agreementUuid, {}, this.stop);
    this.rental.set(r);
    const o = await this.api.get<Summary>('/orders/' + r.orderUuid + '/summary', {}, this.stop);
    this.summary.set(o);
    this.yard = o.order.yardUuid;
    if (!this.form.controls['from'].dirty) this.form.controls['from'].setValue(x.actualFrom ?? '');
    if (!this.form.controls['to'].dirty)
      this.form.controls['to'].setValue(x.actualTo ?? new Date().toISOString());
    this.form.valueChanges.pipe(takeUntil(this.ended)).subscribe(() => this.preview.set(null));
  }
  async calculate() {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.can('RENTAL_BILL')) return;
    this.busy.set(true);
    try {
      const v = this.form.getRawValue();
      this.preview.set(
        await this.api.post<Preview>('/billings/preview', {
          assignmentUuid: this.id,
          from: instant(v['from']),
          to: instant(v['to']),
        }),
      );
      this.form.markAsPristine();
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.busy.set(false);
    }
  }
  async confirm() {
    const p = this.preview();
    if (
      !p ||
      !this.can('RENTAL_BILL') ||
      !window.confirm(
        'Registrar este corte administrativo definitivo? Los mínimos y periodos iniciados se aplican por segmento.',
      )
    )
      return;
    this.busy.set(true);
    try {
      const result = await this.pending.create<Entity>('BILLING', '/billings', {
        requestKey: this.key,
        assignmentUuid: this.id,
        from: p.from,
        to: p.to,
        expectedCalculationFingerprint: p.calculationFingerprint,
      });
      this.form.markAsPristine();
      void this.router.navigate(['/comercial/cortes', result.uuid]);
    } catch (e) {
      this.preview.set(null);
      if (e && typeof e === 'object' && 'status' in e && e.status === 409)
        this.key = crypto.randomUUID();
      this.error.set(message(e));
    } finally {
      this.busy.set(false);
    }
  }
  rate(slice: Entity) {
    return slice['rateSnapshot'] as Entity | null;
  }
}
