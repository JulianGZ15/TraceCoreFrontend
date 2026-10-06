import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-payment',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent extends FinanceEditor {
  override title = 'Registrar pago o anticipo';
  override permission = 'FINANCE_APPROVE';
  override hint =
    'El registro confirma el pago administrativo. Su aplicación a facturas se guarda por separado.';
  protected setup() {
    this.bind(
      [
        {
          key: 'partyUuid',
          label: 'Tercero',
          type: 'lookup',
          required: true,
          resource: 'party-options',
          params: { activeOnly: 'true' },
        },
        {
          key: 'direction',
          label: 'Dirección',
          type: 'select',
          choices: ['RECEIVABLE', 'PAYABLE'],
          required: true,
        },
        { key: 'currency', label: 'Divisa', required: true, max: 3 },
        { key: 'amount', label: 'Importe', type: 'decimal', required: true },
        { key: 'method', label: 'Método', required: true, max: 50 },
        { key: 'operationReference', label: 'Referencia de operación', required: true, max: 200 },
        { key: 'paidAt', label: 'Fecha del pago con offset UTC', type: 'instant', required: true },
        {
          key: 'evidenceUuid',
          label: 'Evidencia del tercero (opcional)',
          type: 'lookup',
          resource: 'evidence',
          params: { partyUuid: this.data.partyUuid ?? '' },
        },
      ],
      {
        partyUuid: this.data.partyUuid ?? '',
        direction: this.data.direction ?? 'RECEIVABLE',
        currency: this.data.currency ?? 'MXN',
        method: 'TRANSFER',
        paidAt: new Date().toISOString(),
      },
    );
    this.form.get('partyUuid')?.valueChanges.subscribe((p) => {
      this.fields = this.fields.map((f) =>
        f.key === 'evidenceUuid' ? { ...f, params: { partyUuid: p } } : f,
      );
      this.form.get('evidenceUuid')?.setValue('');
    });
  }
  protected async submit() {
    const v = this.form.getRawValue();
    const currencies = await this.api.get<Currency[]>('/currencies');
    const c = currencies.find((c) => c.code === String(v.currency).toUpperCase() && c.active);
    if (!c) throw new Error('Divisa activa requerida.');
    return this.create('PAYMENT', '/payments', {
      ...v,
      uuid: this.uuid,
      currency: c.code,
      amount: money(v.amount, c.fractionDigits, true),
      paidAt: instant(v.paidAt),
      evidenceUuid: optional(v.evidenceUuid),
    });
  }
}
