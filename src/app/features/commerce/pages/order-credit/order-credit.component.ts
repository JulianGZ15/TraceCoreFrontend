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
@Component({
  selector: 'tc-commerce-order-credit',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
    FieldsComponent,
  ],
  templateUrl: './order-credit.component.html',
  styleUrl: './order-credit.component.scss',
})
export class OrderCreditComponent extends CommercePage {
  override title = 'Compromiso de crédito';
  override mode = 'order';
  readonly credit = signal<CreditContext | null>(null);
  readonly saving = signal(false);
  fields: Field[] = [
    { key: 'approvedAmount', label: 'Compromiso aprobado exacto', type: 'decimal', required: true },
    { key: 'reason', label: 'Motivo', type: 'textarea', required: true, max: 500 },
  ];
  form = form(this.fields);
  dirty() {
    return this.form.dirty;
  }
  override async afterLoad() {
    if (!this.session.can('FINANCE_READ')) {
      this.credit.set(null);
      return;
    }
    const c = await this.api.credit<CreditContext>(this.id, this.stop);
    this.credit.set(c);
    this.fields = this.fields.map((f) =>
      f.key === 'approvedAmount' ? { ...f, scale: c.fractionDigits } : f,
    );
    this.form = form(this.fields, {
      approvedAmount: c.commitment ? exact(c.commitment['approvedAmountExact']) : '',
      reason: '',
    });
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.session.can('FINANCE_CREDIT') || !this.credit()) return;
    this.saving.set(true);
    try {
      const c = this.credit()!,
        v = this.form.getRawValue();
      await this.api.reserveCredit({
        orderUuid: this.id,
        approvedAmount: v['approvedAmount'],
        reason: v['reason'],
        version: c.commitment?.version ?? null,
      });
      this.form.markAsPristine();
      await this.reload();
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.saving.set(false);
    }
  }
}
