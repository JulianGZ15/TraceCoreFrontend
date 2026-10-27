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
import { DateFieldComponent } from '../../../../shared/ui/date-field/date-field.component';
import { signedValidator, scaled, optionalExact, uuidPattern } from '../../rules';
@Component({
  selector: 'tc-quality-inspection-editor',
  imports: [ReactiveFormsModule, PageHeading, Feedback, OptionPickerComponent, DateFieldComponent],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.scss',
})
export class InspectionComponent extends QualityEditor {
  readonly operationCapability = 'INSPECTION_MANAGE';
  readonly pending = inject(QualityPending);
  readonly form = this.fb.group({
    assetUuid: [(this.data['assetUuid'] as string) ?? '', this.uuid],
    policyUuid: ['', this.uuid],
    inspectorUuid: ['', this.uuid],
    scheduledAt: ['', this.required],
    facility: [
      '',
      [
        (control: AbstractControl) => (control.value?.trim() ? null : { required: true }),
        Validators.maxLength(500),
      ],
    ],
  });
  async reload() {
    if (await this.discard()) {
      this.form.reset();
    }
  }
  async save() {
    await this.saveWith(async () => {
      const r = this.form.getRawValue();
      return this.pending.create<M.Inspection>('inspections', {
        ...r,
        facility: r.facility?.trim(),
        scheduledAt: r.scheduledAt,
      });
    });
  }
}
