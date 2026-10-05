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
  selector: 'tc-quality-maintenance-editor',
  imports: [ReactiveFormsModule, PageHeading, Feedback, OptionPickerComponent],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss',
})
export class MaintenanceComponent extends QualityEditor {
  readonly operationCapability = 'MAINTENANCE_MANAGE';
  readonly pending = inject(QualityPending);
  readonly form = this.fb.group({
    assetUuid: [(this.data['assetUuid'] as string) ?? '', this.uuid],
    kind: ['PREVENTIVE', this.required],
    reason: ['', this.required],
    scheduledAt: ['', this.required],
    responsibleUuid: ['', this.uuid],
    workshopUuid: [''],
    providerUuid: [''],
  });
  async reload() {
    if (await this.discard()) {
      this.form.reset();
    }
  }
  async save() {
    await this.saveWith(async () => {
      const r = this.form.getRawValue();
      return this.pending.create<M.WorkOrder>('maintenance', {
        ...r,
        scheduledAt: toInstant(r.scheduledAt!),
        workshopUuid: r.workshopUuid || null,
        providerUuid: r.providerUuid || null,
      });
    });
  }
}
