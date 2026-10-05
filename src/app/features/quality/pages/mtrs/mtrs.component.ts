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
import { MtrComponent } from '../../editors/mtr/mtr.component';
@Component({
  selector: 'tc-quality-mtrs',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    QualityNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './mtrs.component.html',
  styleUrl: './mtrs.component.scss',
})
export class MtrsComponent extends QualityPage {
  readonly rows = signal<M.Mtr[]>([]);
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () => this.get<M.Mtr[]>('/mtrs', { offset: this.offset(), limit: this.limit() }),
      (r) => this.rows.set(r),
    );
  }
  async create() {
    const r = await this.editor(MtrComponent, {}, 'Nuevo MTR');
    if (r && typeof r === 'object' && 'uuid' in r)
      await this.router.navigate(['/calidad/mtrs', r.uuid]);
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
