import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-cancel',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './cancel.component.html',
  styleUrl: './cancel.component.scss',
})
export class CancelComponent extends FinanceEditor {
  override title = 'Cancelar factura borrador';
  override resource = 'invoices';
  override hint =
    'La cancelación conserva el historial y permite reutilizar serie/folio en un nuevo UUID. No se edita este borrador.';
  protected setup() {
    this.bind([{ key: 'reason', label: 'Motivo', required: true, type: 'textarea', max: 500 }]);
  }
  protected submit() {
    return this.api.post('/invoices/' + this.data.row?.uuid + '/cancel', {
      ...this.form.getRawValue(),
      version: this.data.row?.version,
    });
  }
}
