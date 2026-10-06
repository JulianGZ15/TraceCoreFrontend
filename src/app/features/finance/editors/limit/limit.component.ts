import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-limit',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './limit.component.html',
  styleUrl: './limit.component.scss',
})
export class LimitComponent extends FinanceEditor {
  override title = 'Modificar límite';
  override permission = 'FINANCE_CREDIT';
  override resource = 'credit-accounts';
  override hint = 'El servidor comprobará que el nuevo límite cubra la exposición actual.';
  protected setup() {
    try {
      this.bind(
        [
          { key: 'creditLimit', label: 'Nuevo límite', required: true, type: 'decimal' },
          { key: 'reason', label: 'Motivo', required: true, type: 'textarea', max: 500 },
        ],
        { creditLimit: exact(this.data.row?.['creditLimitExact']) },
      );
    } catch (e) {
      this.compatible.set(false);
      this.error.set((e as Error).message);
    }
  }
  protected submit() {
    const v = this.form.getRawValue();
    return this.api.post('/credit-accounts/' + this.data.row?.uuid + '/limit', {
      ...v,
      creditLimit: money(v.creditLimit, this.data.row?.['fractionDigits'] as number),
      version: this.data.row?.version,
    });
  }
}
