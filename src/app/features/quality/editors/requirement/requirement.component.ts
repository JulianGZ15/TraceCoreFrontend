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
  selector: 'tc-quality-requirement-editor',
  imports: [ReactiveFormsModule, PageHeading, Feedback, OptionPickerComponent],
  templateUrl: './requirement.component.html',
  styleUrl: './requirement.component.scss',
})
export class RequirementComponent extends QualityEditor {
  readonly operationCapability = 'QUALITY_MANAGE';
  override readonly companyOperation = true;
  readonly pending = inject(QualityPending);
  readonly form = this.fb.group({
    sheetUuid: ['', this.uuid],
    standardUuid: ['', this.uuid],
    scope: ['', this.required],
    requirements: ['', this.required],
    requireMtr: [false],
    requireCertification: [false],
  });
  async reload() {
    if (await this.discard()) {
      this.form.reset();
    }
  }
  async save() {
    await this.saveWith(async () => {
      return this.api.post<M.Requirement>('/requirements', this.form.getRawValue());
    });
  }
}
