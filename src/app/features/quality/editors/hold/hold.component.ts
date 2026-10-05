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
  selector: 'tc-quality-hold-editor',
  imports: [ReactiveFormsModule, PageHeading, Feedback, EvidencePickerComponent],
  templateUrl: './hold.component.html',
  styleUrl: './hold.component.scss',
})
export class HoldComponent extends QualityEditor {
  readonly operationCapability = 'QUALITY_MANAGE';
  readonly pending = inject(QualityPending);
  readonly form = this.fb.group({
    type: ['QUALITY', this.required],
    reason: ['', this.required],
    evidenceUuid: ['', this.uuid],
  });
  async reload() {
    if (await this.discard()) {
      this.form.reset();
    }
  }
  async save() {
    await this.saveWith(async () => {
      return this.api.post<M.Hold>('/holds', {
        ...this.form.getRawValue(),
        assetUuid: this.data['assetUuid'],
      });
    });
  }
}
