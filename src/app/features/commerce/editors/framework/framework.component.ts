import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommerceEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { exact, instant, fraction } from '../../rules';
@Component({
  selector: 'tc-commerce-framework-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './framework.component.html',
  styleUrl: './framework.component.scss',
})
export class FrameworkComponent extends CommerceEditor {
  override resourceKind = 'frameworks';
  override permission = 'CONTRACT_MANAGE';
  uuid = '';
  override allowed() {
    return this.session.can('CONTRACT_MANAGE');
  }
  setup() {
    const r = this.data.row;
    this.uuid = r?.uuid ?? crypto.randomUUID();
    this.title = r ? 'Editar contrato marco' : 'Nuevo contrato marco';
    this.make(
      [
        { key: 'folio', label: 'Folio', required: true, readonly: !!r },
        {
          key: 'partyUuid',
          label: 'Contraparte',
          type: 'lookup',
          resource: 'party-options',
          required: true,
          readonly: !!r,
        },
        { key: 'from', label: 'Inicio', type: 'instant', required: true },
        { key: 'to', label: 'Fin', type: 'instant', required: true },
        { key: 'scope', label: 'Alcance', type: 'textarea', required: true, max: 1000 },
        { key: 'terms', label: 'Términos', type: 'textarea', required: true },
      ],
      {
        folio: r?.folio,
        partyUuid: r?.partyUuid,
        from: r?.validFrom,
        to: r?.validTo,
        scope: r?.['scope'],
        terms: r?.['terms'],
      },
    );
  }
  submit() {
    const r = this.data.row,
      v = this.form.getRawValue();
    const framework = {
      ...v,
      uuid: this.uuid,
      folio: r?.folio ?? v['folio'],
      partyUuid: r?.partyUuid ?? v['partyUuid'],
      from: instant(v['from']),
      to: instant(v['to']),
    };
    return r
      ? this.api.put<Entity>('/frameworks/' + r.uuid, { framework, version: r.version })
      : this.create('FRAMEWORK', '/frameworks', framework);
  }
}
