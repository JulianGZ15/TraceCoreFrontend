import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-account-action',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './account-action.component.html',
  styleUrl: './account-action.component.scss',
})
export class AccountActionComponent extends FinanceEditor {
  override permission = 'FINANCE_CREDIT';
  override resource = 'credit-accounts';
  override hint =
    'La activación se confirma por separado. Bloquear impide nueva elegibilidad, sin borrar deuda ni compromisos.';
  protected setup() {
    this.title = this.data.action === 'block' ? 'Bloquear cuenta' : 'Activar o reactivar cuenta';
    this.bind(
      this.data.action === 'block'
        ? [{ key: 'reason', label: 'Motivo', required: true, type: 'textarea', max: 500 }]
        : [],
    );
  }
  protected async submit() {
    if (this.data.action !== 'block') {
      const check = await this.api.get<Check>(
        '/credit-accounts/' + this.data.row?.uuid + '/activation-check',
      );
      if (!check.allowed)
        throw new Error(
          'La activación tiene bloqueos: ' + check.blockers.map((b) => b.code).join(', '),
        );
    }
    return this.api.post(
      '/credit-accounts/' +
        this.data.row?.uuid +
        '/' +
        (this.data.action === 'block' ? 'block' : 'activate'),
      { ...this.form.getRawValue(), version: this.data.row?.version },
    );
  }
}
