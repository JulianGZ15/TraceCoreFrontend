import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-commitment-action',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './commitment-action.component.html',
  styleUrl: './commitment-action.component.scss',
})
export class CommitmentActionComponent extends FinanceEditor {
  override permission = 'FINANCE_CREDIT';
  override resource = 'credit-reservations';
  override hint =
    'Cada cambio se registra con motivo y versión. Liquidar libera solo el excedente estimado; no cancela deuda.';
  protected setup() {
    this.title =
      this.data.action === 'settle'
        ? 'Liquidar excedente del compromiso'
        : 'Aprobar o modificar compromiso';
    this.bind(
      this.data.action === 'settle'
        ? [{ key: 'reason', label: 'Motivo', required: true, type: 'textarea', max: 500 }]
        : [
            {
              key: 'orderUuid',
              label: 'Orden',
              type: 'lookup',
              required: true,
              resource: 'order-options',
            },
            {
              key: 'approvedAmount',
              label: 'Compromiso aprobado',
              type: 'decimal',
              required: true,
            },
            { key: 'reason', label: 'Motivo', type: 'textarea', required: true, max: 500 },
          ],
      {
        orderUuid: this.data.row?.['orderUuid'] ?? '',
        approvedAmount: this.data.row ? exact(this.data.row['approvedAmountExact']) : '',
      },
    );
  }
  protected async submit() {
    const row = this.data.row,
      v = this.form.getRawValue();
    if (this.data.action === 'settle') {
      const check = await this.api.get<Check>(
        '/credit-reservations/' + row?.uuid + '/settlement-check',
      );
      if (!check.allowed)
        throw new Error('Pendientes: ' + check.blockers.map((b) => b.code).join(', '));
      return this.api.post('/credit-reservations/' + row?.uuid + '/settle', {
        reason: v.reason,
        version: row?.version,
      });
    }
    const context = await this.api.get<Entity>('/orders/' + v.orderUuid + '/summary');
    const current = context['commitment'] as Entity | null;
    if ((row?.version ?? null) !== (current?.version ?? null))
      throw new Error('El compromiso cambió. Consulta su estado antes de confirmar.');
    const c = (await this.api.get<Currency[]>('/currencies')).find(
      (c) => c.code === context['currency'],
    );
    if (!c) throw new Error('Divisa incompatible.');
    return this.api.post('/credit-reservations', {
      orderUuid: v.orderUuid,
      approvedAmount: money(v.approvedAmount, c.fractionDigits),
      reason: v.reason,
      version: current?.version ?? null,
    });
  }
}
