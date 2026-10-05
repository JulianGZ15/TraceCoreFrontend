import { Component, inject, input, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl, AbstractControl } from '@angular/forms';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import * as M from '../../models';
import { QualityEditor } from '../../editor-base';
import { Validators, FormArray, FormGroup } from '@angular/forms';
import { QualityPending } from '../../pending';
import { OptionPickerComponent } from '../../selectors/option-picker/option-picker.component';
import { EvidencePickerComponent } from '../../selectors/evidence-picker/evidence-picker.component';
import { signedValidator, scaled, optionalExact, toInstant, uuidPattern } from '../../rules';
@Component({
  selector: 'tc-quality-task-editor',
  imports: [ReactiveFormsModule, PageHeading, Feedback],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss',
})
export class TaskComponent extends QualityEditor {
  readonly operationCapability = 'MAINTENANCE_MANAGE';
  readonly pending = inject(QualityPending);
  readonly form = this.fb.group({
    code: ['', this.required],
    description: ['', this.required],
    requirements: ['', this.required],
  });
  record: M.Task | null = null;
  ngOnInit() {
    this.record = (this.data['record'] as M.Task) ?? null;
    if (this.record) this.form.reset(this.record);
  }
  async reload() {
    if (await this.discard()) {
      const rows = await this.get<M.Task[]>('/maintenance/' + this.data['orderUuid'] + '/tasks');
      const parent = await this.get<M.WorkOrder>('/maintenance/' + this.data['orderUuid']);
      this.data['orderVersion'] = parent.version;
      if (this.record) {
        this.record = rows.find((r) => r.uuid === this.record!.uuid) ?? null;
        if (this.record) this.form.reset(this.record);
      }
    }
  }
  async save() {
    await this.saveWith(async () => {
      const r = this.form.getRawValue();
      return this.record
        ? this.api.put<M.Task>('/tasks/' + this.record.uuid, {
            ...r,
            version: this.record.version,
            orderVersion: this.data['orderVersion'],
          })
        : this.api.post<M.Task>('/maintenance/' + this.data['orderUuid'] + '/tasks', r);
    });
  }
}
