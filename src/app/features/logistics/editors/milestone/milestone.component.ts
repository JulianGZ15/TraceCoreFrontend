import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LogisticsEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { instant } from '../../rules';
@Component({
  selector: 'tc-logistics-milestone-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './milestone.component.html',
  styleUrl: './milestone.component.scss',
})
export class MilestoneComponent extends LogisticsEditor {
  override allowed() {
    return !!this.data.summary && this.access.manage(this.data.summary.manifest);
  }
  setup() {
    const s = this.data.summary!;
    this.title = 'Registrar hito';
    const incident = ['IN_TRANSIT', 'PARTIALLY_DELIVERED'].includes(s.manifest.state);
    this.make(
      [
        {
          key: 'type',
          label: 'Tipo',
          type: 'select',
          choices: incident ? ['INCIDENT'] : ['PREPARATION'],
          required: true,
        },
        { key: 'place', label: 'Lugar', required: true, max: 200 },
        { key: 'effectiveAt', label: 'Fecha efectiva', type: 'instant', required: true },
        { key: 'reference', label: 'Referencia', required: true, max: 500 },
        {
          key: 'evidenceUuid',
          label: 'Evidencia',
          type: 'lookup',
          resource: 'manifests/' + s.manifest.uuid + '/evidence',
          required: incident,
        },
      ],
      { type: incident ? 'INCIDENT' : 'PREPARATION', effectiveAt: new Date().toISOString() },
    );
  }
  submit() {
    const v = this.form.getRawValue();
    return this.create(
      'MILESTONE',
      '/manifests/' + this.data.summary!.manifest.uuid + '/milestones',
      {
        ...v,
        effectiveAt: instant(v['effectiveAt']),
        evidenceUuid: v['evidenceUuid'] || null,
        requestKey: crypto.randomUUID(),
      },
    );
  }
}
