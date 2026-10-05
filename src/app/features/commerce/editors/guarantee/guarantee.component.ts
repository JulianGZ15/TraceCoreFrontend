import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommerceEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { exact, instant, fraction } from '../../rules';
@Component({
  selector: 'tc-commerce-guarantee-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './guarantee.component.html',
  styleUrl: './guarantee.component.scss',
})
export class GuaranteeComponent extends CommerceEditor {
  override permission = 'CONTRACT_MANAGE';
  uuid = crypto.randomUUID();
  setup() {
    this.title = 'Registrar garantía administrativa';
    this.make([
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        choices: ['DEPOSIT', 'LETTER', 'BOND'],
        required: true,
      },
      {
        key: 'issuerUuid',
        label: 'Emisor',
        type: 'lookup',
        resource: 'party-options',
        params: { purpose: 'ISSUER' },
        required: true,
      },
      { key: 'amount', label: 'Importe', type: 'decimal', scale: 4, required: true },
      { key: 'from', label: 'Inicio', type: 'instant', required: true },
      { key: 'to', label: 'Fin', type: 'instant', required: true },
      {
        key: 'evidenceUuid',
        label: 'Evidencia de la OR',
        type: 'lookup',
        resource: 'evidence',
        params: { orderUuid: this.data.summary!.order.uuid },
        required: true,
      },
    ]);
  }
  submit() {
    const v = this.form.getRawValue();
    return this.create('GUARANTEE', '/guarantees', {
      ...v,
      uuid: this.uuid,
      agreementUuid: this.data.rental!.uuid,
      from: instant(v['from']),
      to: instant(v['to']),
    });
  }
}
