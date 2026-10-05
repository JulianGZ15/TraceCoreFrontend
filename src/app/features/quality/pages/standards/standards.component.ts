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
import { StandardComponent } from '../../editors/standard/standard.component';
@Component({
  selector: 'tc-quality-standards',
  imports: [PageHeading, Feedback, Pagination, QualityNavComponent, PendingRequestsComponent],
  templateUrl: './standards.component.html',
  styleUrl: './standards.component.scss',
})
export class StandardsComponent extends QualityPage {
  readonly rows = signal<M.Standard[]>([]);
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () => this.get<M.Standard[]>('/standards', { offset: this.offset(), limit: this.limit() }),
      (r) => this.rows.set(r),
    );
  }
  async create() {
    if (await this.editor(StandardComponent, {}, 'Nuevo estándar')) await this.load();
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
