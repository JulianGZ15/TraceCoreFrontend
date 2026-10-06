import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-account',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent extends FinanceEditor {
  override title = 'Crear cuenta de crédito';
  override permission = 'FINANCE_CREDIT';
  override hint =
    'Crear DRAFT no habilita crédito. La activación requiere revisar órdenes y exposición existentes.';
  protected setup() {
    this.bind(
      [
        {
          key: 'partyUuid',
          label: 'Tercero',
          required: true,
          type: 'lookup',
          resource: 'party-options',
          params: { activeOnly: 'true' },
        },
        { key: 'currency', label: 'Divisa', required: true, max: 3 },
        { key: 'creditLimit', label: 'Límite', required: true, type: 'decimal' },
        { key: 'validFrom', label: 'Vigencia desde (offset UTC)', required: true, type: 'instant' },
        { key: 'validTo', label: 'Vigencia hasta (opcional)', type: 'instant' },
      ],
      {
        partyUuid: this.data.partyUuid ?? '',
        currency: this.data.currency ?? 'MXN',
        validFrom: new Date().toISOString(),
      },
    );
  }
  protected async submit() {
    const v = this.form.getRawValue();
    const c = (await this.api.get<Currency[]>('/currencies')).find(
      (c) => c.code === String(v.currency).toUpperCase() && c.active,
    );
    if (!c) throw new Error('Divisa activa requerida.');
    return this.create('ACCOUNT', '/credit-accounts', {
      uuid: this.uuid,
      ...v,
      currency: c.code,
      creditLimit: money(v.creditLimit, c.fractionDigits),
      validFrom: instant(v.validFrom),
      validTo: v.validTo ? instant(v.validTo) : null,
    });
  }
}
