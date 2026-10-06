import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-invoice-post',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './invoice-post.component.html',
  styleUrl: './invoice-post.component.scss',
})
export class InvoicePostComponent extends FinanceEditor {
  override title = 'Confirmar factura';
  override permission = 'FINANCE_APPROVE';
  override resource = 'invoices';
  override hint =
    'Confirmar congela el snapshot e incorpora deuda. El servidor revalida los cargos disponibles.';
  protected setup() {
    this.bind([]);
  }
  protected submit() {
    return this.api.post('/invoices/' + this.data.row?.uuid + '/post', {
      version: this.data.row?.version,
    });
  }
}
