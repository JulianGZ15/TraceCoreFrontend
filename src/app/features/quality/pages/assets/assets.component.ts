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
@Component({
  selector: 'tc-quality-assets',
  imports: [
    RouterLink,
    FormsModule,
    PageHeading,
    Feedback,
    Pagination,
    QualityNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
})
export class AssetsComponent extends QualityPage {
  readonly rows = signal<M.Asset[]>([]);
  search = '';
  lifecycle = '';
  ngOnInit() {
    this.watch(() => {
      const q = this.route.snapshot.queryParamMap;
      this.search = q.get('search') ?? '';
      this.lifecycle = q.get('lifecycle') ?? '';
      return this.load();
    });
  }
  async load() {
    await this.request(
      () =>
        this.get<M.Asset[]>('/assets', {
          yardUuid: this.yard(),
          search: this.search,
          lifecycle: this.lifecycle,
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => this.rows.set(r),
    );
  }
}
