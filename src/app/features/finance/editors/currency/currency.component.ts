import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-currency',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './currency.component.html',
  styleUrl: './currency.component.scss',
})
export class CurrencyComponent extends FinanceEditor {
  override title = 'Registrar divisa';
  override hint = 'La precisión de la divisa es inmutable. No se realizan conversiones de moneda.';
  protected setup() {
    this.bind(
      [
        { key: 'code', label: 'Código', required: true, max: 3 },
        { key: 'name', label: 'Nombre', required: true, max: 100 },
        { key: 'fractionDigits', label: 'Decimales (0 a 8)', required: true, type: 'integer' },
      ],
      { fractionDigits: '2' },
    );
  }
  protected submit() {
    const v = this.form.getRawValue();
    return this.create('CURRENCY', '/currencies', {
      uuid: this.uuid,
      code: String(v.code).toUpperCase(),
      name: v.name,
      fractionDigits: parseInt(v.fractionDigits, 10),
    });
  }
}
