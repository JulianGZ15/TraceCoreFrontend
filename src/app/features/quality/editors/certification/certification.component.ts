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
  selector: 'tc-quality-certification-editor',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    OptionPickerComponent,
    EvidencePickerComponent,
  ],
  templateUrl: './certification.component.html',
  styleUrl: './certification.component.scss',
})
export class CertificationComponent extends QualityEditor {
  readonly assetReference = String(this.data['assetUuid'] ?? '');
  readonly operationCapability = 'QUALITY_APPROVE';
  readonly pending = inject(QualityPending);
  readonly form = this.fb.group({
    standardUuid: ['', this.uuid],
    inspectionUuid: ['', this.uuid],
    issuerUuid: ['', this.uuid],
    number: ['', this.required],
    scope: ['', this.required],
    issuedAt: ['', this.required],
    expiresAt: ['', this.required],
    evidenceUuid: ['', this.uuid],
  });
  async reload() {
    if (await this.discard()) {
      this.form.reset();
    }
  }
  async save() {
    await this.saveWith(async () => {
      const r = this.form.getRawValue();
      return this.api.post<M.Certification>('/certifications', {
        ...r,
        assetUuid: this.data['assetUuid'],
        issuedAt: toInstant(r.issuedAt!),
        expiresAt: toInstant(r.expiresAt!),
      });
    });
  }
}
