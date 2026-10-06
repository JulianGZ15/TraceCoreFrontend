import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FinanceEditor } from '../../editor';
import { Entity, Currency, Check } from '../../models';
import { form, money, optional, instant, exact } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
@Component({
  selector: 'tc-finance-reversal',
  imports: [ReactiveFormsModule, FieldsComponent],
  templateUrl: './reversal.component.html',
  styleUrl: './reversal.component.scss',
})
export class ReversalComponent extends FinanceEditor {
  override title = 'Registrar reverso explícito';
  override permission = 'FINANCE_APPROVE';
  override hint =
    'Los originales y su historial permanecen. Revierte primero las aplicaciones y notas dependientes, una operación a la vez.';
  protected setup() {
    this.bind([
      { key: 'reason', label: 'Motivo', required: true, type: 'textarea', max: 500 },
      { key: 'evidenceUuid', label: 'UUID de evidencia del mismo tercero (opcional)' },
    ]);
  }
  protected submit() {
    const targets: Record<string, string> = {
      invoices: 'invoiceUuid',
      payments: 'paymentUuid',
      applications: 'allocationUuid',
      notes: 'creditNoteUuid',
    };
    const target = targets[this.data.resource ?? ''];
    if (!target || !this.data.row) throw new Error('Selecciona un documento o aplicación.');
    const v = this.form.getRawValue();
    return this.create('REVERSAL', '/reversals', {
      uuid: this.uuid,
      invoiceUuid: null,
      paymentUuid: null,
      allocationUuid: null,
      creditNoteUuid: null,
      [target]: this.data.row.uuid,
      reason: v.reason,
      evidenceUuid: optional(v.evidenceUuid),
    });
  }
}
