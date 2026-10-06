import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LogisticsEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity } from '../../models';
@Component({
  selector: 'tc-logistics-cancel-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './cancel.component.html',
  styleUrl: './cancel.component.scss',
})
export class CancelComponent extends LogisticsEditor {
  override allowed() {
    return (
      !!this.data.summary &&
      this.access.manage(this.data.summary.manifest) &&
      ['DRAFT', 'CHECKED'].includes(this.data.summary.manifest.state)
    );
  }
  setup() {
    this.title = 'Cancelar manifiesto y sus movimientos';
    this.make([{ key: 'reason', label: 'Motivo', type: 'textarea', required: true, max: 500 }]);
  }
  submit() {
    return this.api.post<Entity>('/manifests/' + this.data.summary!.manifest.uuid + '/cancel', {
      reason: this.form.getRawValue()['reason'],
      version: this.data.summary!.manifest.version,
    });
  }
}
