import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommerceEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { exact, instant, fraction } from '../../rules';
@Component({
  selector: 'tc-commerce-mode-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './mode.component.html',
  styleUrl: './mode.component.scss',
})
export class ModeComponent extends CommerceEditor {
  override permission = 'RENTAL_MANAGE';
  setup() {
    this.title = 'Cambiar modo del grupo';
    this.make([
      {
        key: 'mode',
        label: 'Nuevo modo',
        type: 'select',
        choices: ['ACTIVE', 'STANDBY', 'PAUSED'],
        required: true,
      },
      { key: 'effectiveAt', label: 'Instante efectivo', type: 'instant', required: true },
      { key: 'reason', label: 'Motivo', type: 'textarea', required: true, max: 1000 },
    ]);
  }
  async submit() {
    const v = this.form.getRawValue();
    await this.api.post('/assignments/' + this.data.row!.uuid + '/mode', {
      ...v,
      effectiveAt: instant(v['effectiveAt']),
      version: this.data.row!.version,
    });
    return this.data.row!;
  }
}
