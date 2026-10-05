import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommerceEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { exact, instant, fraction } from '../../rules';
@Component({
  selector: 'tc-commerce-insurance-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './insurance.component.html',
  styleUrl: './insurance.component.scss',
})
export class InsuranceComponent extends CommerceEditor {
  override permission = 'CONTRACT_MANAGE';
  uuid = crypto.randomUUID();
  setup() {
    this.title = 'Registrar póliza';
    this.make([
      {
        key: 'insurerUuid',
        label: 'Aseguradora',
        type: 'lookup',
        resource: 'party-options',
        params: { purpose: 'INSURER' },
        required: true,
      },
      { key: 'folio', label: 'Folio', required: true },
      { key: 'from', label: 'Inicio', type: 'instant', required: true },
      { key: 'to', label: 'Fin', type: 'instant', required: true },
      { key: 'coverage', label: 'Cobertura', type: 'textarea', required: true },
      {
        key: 'insuredAmount',
        label: 'Importe asegurado',
        type: 'decimal',
        scale: 4,
        required: true,
      },
      {
        key: 'beneficiaryUuid',
        label: 'Beneficiario',
        type: 'lookup',
        resource: 'party-options',
        params: { purpose: 'BENEFICIARY' },
        required: true,
      },
      {
        key: 'evidenceUuid',
        label: 'Evidencia de esta orden',
        type: 'lookup',
        resource: 'evidence',
        params: { orderUuid: this.data.summary!.order.uuid },
        required: true,
      },
    ]);
  }
  submit() {
    const v = this.form.getRawValue();
    return this.create('POLICY', '/policies', {
      ...v,
      uuid: this.uuid,
      orderUuid: this.data.summary!.order.uuid,
      from: instant(v['from']),
      to: instant(v['to']),
    });
  }
}
