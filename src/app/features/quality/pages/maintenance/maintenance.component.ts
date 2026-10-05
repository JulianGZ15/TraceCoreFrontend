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
  selector: 'tc-quality-maintenance',
  imports: [
    RouterLink,
    FormsModule,
    PageHeading,
    Feedback,
    Pagination,
    QualityNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss',
})
export class MaintenanceComponent extends QualityPage {
  readonly rows = signal<M.Row<M.WorkOrder>[]>([]);
  assetUuid = '';
  state = '';
  responsible = '';
  from = '';
  to = '';
  kind = '';
  ngOnInit() {
    this.watch(() => {
      const q = this.route.snapshot.queryParamMap;
      this.assetUuid = q.get('assetUuid') ?? '';
      this.state = q.get('state') ?? '';
      this.responsible = q.get('responsibleUuid') ?? '';
      this.from = q.get('scheduledFrom') ?? '';
      this.to = q.get('scheduledTo') ?? '';
      this.kind = q.get('kind') ?? '';
      return this.load();
    });
  }
  apply() {
    this.filter({
      yardUuid: this.yard() || null,
      assetUuid: this.assetUuid || null,
      state: this.state || null,
      responsibleUuid: this.responsible || null,
      scheduledFrom: this.from || null,
      scheduledTo: this.to || null,
      kind: this.kind || null,
    });
  }
  async load() {
    await this.request(
      () =>
        this.get<M.Row<M.WorkOrder>[]>('/maintenance', {
          offset: this.offset(),
          limit: this.limit(),
          yardUuid: this.yard(),
          assetUuid: this.assetUuid,
          state: this.state,
          responsibleUuid: this.responsible,
          scheduledFrom: this.from,
          scheduledTo: this.to,
          kind: this.kind,
        }),
      (r) => this.rows.set(r),
    );
  }
}
