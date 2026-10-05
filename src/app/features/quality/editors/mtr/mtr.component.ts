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
  selector: 'tc-quality-mtr-editor',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    OptionPickerComponent,
    EvidencePickerComponent,
  ],
  templateUrl: './mtr.component.html',
  styleUrl: './mtr.component.scss',
})
export class MtrComponent extends QualityEditor {
  readonly operationCapability = 'QUALITY_MANAGE';
  override readonly companyOperation = true;
  readonly pending = inject(QualityPending);
  readonly form = this.fb.group({
    issuerUuid: ['', this.uuid],
    number: ['', this.required],
    certificateType: ['', this.required],
    documentRevision: ['', this.required],
    issuedAt: ['', this.required],
    evidenceUuid: ['', this.uuid],
  });
  record: M.Mtr | null = null;
  ngOnInit() {
    this.record = (this.data['record'] as M.Mtr) ?? null;
    if (this.record) this.form.reset(this.record);
  }
  async reload() {
    if (this.record && (await this.discard()))
      await this.request(
        () => this.get<M.Mtr>('/mtrs/' + this.record!.uuid),
        (r) => {
          this.record = r;
          this.form.reset(r);
        },
      );
  }
  async save() {
    await this.saveWith(async () => {
      const r = this.form.getRawValue();
      const payload = { ...r, issuedAt: toInstant(r.issuedAt!) };
      return this.record
        ? this.api.put<M.Mtr>('/mtrs/' + this.record.uuid, {
            ...payload,
            version: this.record.version,
          })
        : this.api.post<M.Mtr>('/mtrs', payload);
    });
  }
}
