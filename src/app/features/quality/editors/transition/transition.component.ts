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
  selector: 'tc-quality-transition-editor',
  imports: [ReactiveFormsModule, PageHeading, Feedback, EvidencePickerComponent],
  templateUrl: './transition.component.html',
  styleUrl: './transition.component.scss',
})
export class TransitionComponent extends QualityEditor {
  readonly operationCapability = 'TRANSITION';
  readonly pending = inject(QualityPending);
  readonly form = this.fb.group({ reason: ['', this.required], evidenceUuid: [''] });
  ngOnInit() {
    if (this.data['evidenceRequired']) this.form.controls.evidenceUuid.setValidators(this.uuid);
  }
  async reload() {
    if (await this.discard()) this.ref?.close({ reload: true });
  }
  async save() {
    await this.saveWith(async () => {
      const r = this.form.getRawValue();
      return this.api.post(this.data['path'] as string, {
        reason: r.reason,
        evidenceUuid: r.evidenceUuid || null,
        version: this.data['version'],
        mtrVersion: this.data['mtrVersion'],
        approved: this.data['approved'],
      });
    });
  }
}
