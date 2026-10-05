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
import { PolicyComponent as PolicyEditor } from '../../editors/policy/policy.component';
@Component({
  selector: 'tc-quality-policy',
  imports: [PageHeading, Feedback, QualityNavComponent, PendingRequestsComponent, PolicyEditor],
  templateUrl: './policy.component.html',
  styleUrl: './policy.component.scss',
})
export class PolicyComponent extends QualityPage {
  readonly record = signal<M.Policy | null>(null);
  readonly editorView = viewChild(PolicyEditor);
  get form() {
    return this.editorView()?.form;
  }
  ngOnInit() {
    if (this.route.snapshot.paramMap.has('uuid')) this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () => this.get<M.Policy>('/policies/' + this.id()),
      (r) => this.record.set(r),
    );
  }
  async transition(path: string, version: number, approved?: boolean, evidenceRequired = false) {
    if (this.form?.dirty) {
      this.error.set('Guarda o descarta el borrador antes de aprobar.');
      return;
    }
    const r = await this.editor(
      TransitionComponent,
      { path, version, approved, evidenceRequired },
      'Confirmar operación',
    );
    if (r) await this.load();
  }
}
