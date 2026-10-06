import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-allocation',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './allocation.component.html',
  styleUrl: './allocation.component.scss',
})
export class AllocationComponent extends FinanceEditor {
  override title = 'Aplicar pago';
  override permission = 'FINANCE_APPROVE';
  override hint =
    'Una aplicación no modifica el pago ni la factura. Solo admite misma contraparte, dirección y divisa.';
  protected setup() {
    const p = this.data.context ?? this.data.row;
    const params = {
      partyUuid: String(p?.['partyUuid'] ?? this.data.partyUuid ?? ''),
      currency: String(p?.['currency'] ?? this.data.currency ?? 'MXN'),
      direction: String(p?.['direction'] ?? this.data.direction ?? 'RECEIVABLE'),
    };
    this.bind(
      [
        {
          key: 'paymentUuid',
          label: 'Pago con remanente',
          required: true,
          type: 'lookup',
          resource: 'payment-options',
          params,
        },
        {
          key: 'invoiceUuid',
          label: 'Factura con saldo',
          required: true,
          type: 'lookup',
          resource: 'invoice-options',
          params,
        },
        { key: 'amount', label: 'Importe a aplicar', required: true, type: 'decimal' },
      ],
      {
        paymentUuid: this.data.resource === 'payments' ? this.data.row?.uuid : '',
        invoiceUuid: this.data.resource === 'invoices' ? this.data.row?.uuid : '',
      },
    );
  }
  protected async submit() {
    const v = this.form.getRawValue();
    const payment = await this.api.get<{ payment: Entity; unappliedExact: string }>(
      '/payments/' + v.paymentUuid + '/summary',
    );
    exact(payment.unappliedExact);
    return this.create('ALLOCATION', '/payment-allocations', {
      uuid: this.uuid,
      ...v,
      amount: money(v.amount, payment.payment['fractionDigits'] as number, true),
    });
  }
}
