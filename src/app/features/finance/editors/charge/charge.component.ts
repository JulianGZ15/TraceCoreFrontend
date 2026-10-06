import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-charge',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './charge.component.html',
  styleUrl: './charge.component.scss',
})
export class ChargeComponent extends FinanceEditor {
  override title = 'Registrar cargo';
  override hint =
    'Selecciona una fuente cumplida. El servidor determina tercero, divisa, dirección e importe; MANUAL exige evidencia y FINANCE_APPROVE.';
  protected setup() {
    this.bind(
      [
        {
          key: 'orderUuid',
          label: 'Orden',
          type: 'lookup',
          required: true,
          resource: 'order-options',
        },
        {
          key: 'kind',
          label: 'Origen',
          type: 'select',
          choices: [
            'SERVICE',
            'SALE',
            'PURCHASE',
            'RENTAL',
            ...(this.access.can('FINANCE_APPROVE') ? ['MANUAL'] : []),
          ],
          required: true,
        },
        {
          key: 'originUuid',
          label: 'Fuente cumplida',
          type: 'lookup',
          resource: 'charge-origins',
          params: { orderUuid: '', kind: 'SERVICE' },
        },
        { key: 'reference', label: 'Referencia', required: true, max: 500 },
      ],
      { kind: 'SERVICE' },
    );
    let previousKind = 'SERVICE',
      previousOrder = '';
    this.form.valueChanges.subscribe((v) => {
      const kind = v.kind,
        orderUuid = v.orderUuid;
      if (kind !== previousKind || orderUuid !== previousOrder) {
        this.form.get('originUuid')?.setValue('', { emitEvent: false });
        this.fields = this.fields.map((f) =>
          f.key === 'originUuid' ? { ...f, params: { kind, orderUuid } } : f,
        );
        previousKind = kind;
        previousOrder = orderUuid;
      }
      if (kind !== 'MANUAL' && this.form.contains('concept')) {
        const keys = ['concept', 'netAmount', 'taxFraction', 'evidenceUuid'];
        this.fields = this.fields.filter((f) => !keys.includes(f.key));
        for (const key of keys) this.form.removeControl(key, { emitEvent: false });
      }
      if (kind === 'MANUAL' && !this.form.contains('concept')) {
        for (const f of [
          { key: 'concept', label: 'Concepto manual', required: true },
          { key: 'netAmount', label: 'Neto manual', required: true, type: 'decimal' as const },
          {
            key: 'taxFraction',
            label: 'Fracción de impuesto (0 a 1)',
            required: true,
            type: 'decimal' as const,
          },
          { key: 'evidenceUuid', label: 'UUID de evidencia del pagador', required: true },
        ]) {
          this.fields = [...this.fields, f];
          this.form.addControl(f.key, form([f]).get(f.key)!, { emitEvent: false });
        }
      }
    });
  }
  protected async submit() {
    const v = this.form.getRawValue();
    if (v.kind === 'MANUAL') {
      if (!this.access.can('FINANCE_APPROVE'))
        throw new Error('El cargo manual requiere FINANCE_APPROVE.');
      const order = await this.api.get<Entity>('/orders/' + v.orderUuid + '/summary');
      const currencies = await this.api.get<Currency[]>('/currencies');
      const c = currencies.find((c) => c.code === order['currency']);
      if (!c) throw new Error('Divisa incompatible.');
      const fraction = money(v.taxFraction, 8);
      if (
        BigInt(fraction.split('.')[0]) > 1n ||
        (fraction.split('.')[0] === '1' && /[1-9]/.test(fraction.split('.')[1] ?? ''))
      )
        throw new Error('La fracción de impuesto debe ser 0 a 1.');
      return this.create('CHARGE', '/charges', {
        uuid: this.uuid,
        kind: v.kind,
        originUuid: null,
        orderUuid: v.orderUuid,
        concept: v.concept,
        netAmount: money(v.netAmount, c.fractionDigits),
        taxFraction: fraction,
        evidenceUuid: v.evidenceUuid,
        reference: v.reference,
      });
    }
    if (!v.originUuid) throw new Error('Selecciona la fuente cumplida.');
    return this.create('CHARGE', '/charges', {
      uuid: this.uuid,
      kind: v.kind,
      originUuid: v.originUuid,
      orderUuid: null,
      concept: null,
      netAmount: null,
      taxFraction: null,
      evidenceUuid: null,
      reference: v.reference,
    });
  }
}
