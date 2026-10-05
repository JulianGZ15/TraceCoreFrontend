import { Component, signal, inject, input, effect, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormArray,
  FormGroup,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import { QualityNavComponent } from '../../shared/quality-nav/quality-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
import { EvidencePickerComponent } from '../../selectors/evidence-picker/evidence-picker.component';
import { OptionPickerComponent } from '../../selectors/option-picker/option-picker.component';
import { signedValidator, optionalExact, toInstant } from '../../rules';
import * as M from '../../models';
import { RequirementComponent } from '../../editors/requirement/requirement.component';
@Component({
  selector: 'tc-quality-requirements',
  imports: [
    PageHeading,
    Feedback,
    Pagination,
    QualityNavComponent,
    PendingRequestsComponent,
    OptionPickerComponent,
  ],
  templateUrl: './requirements.component.html',
  styleUrl: './requirements.component.scss',
})
export class RequirementsComponent extends QualityPage {
  readonly rows = signal<M.Requirement[]>([]);
  readonly sheet = new FormControl('');
  ngOnInit() {
    this.watch(() => {
      this.sheet.setValue(this.route.snapshot.queryParamMap.get('sheetUuid') ?? '');
      return this.load();
    });
  }
  async load() {
    if (!this.sheet.value) {
      this.rows.set([]);
      return;
    }
    await this.request(
      () =>
        this.get<M.Requirement[]>('/requirements', {
          sheetUuid: this.sheet.value,
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => this.rows.set(r),
    );
  }
  async create() {
    if (await this.editor(RequirementComponent, {}, 'Nuevo requisito')) await this.load();
  }
  async transition(path: string, version: number, approved?: boolean, evidenceRequired = false) {
    const r = await this.editor(
      TransitionComponent,
      { path, version, approved, evidenceRequired },
      'Confirmar operación',
    );
    if (r) await this.load();
  }
}
