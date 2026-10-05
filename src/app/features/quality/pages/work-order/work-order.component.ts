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
import { MaintenanceComponent as MaintenanceEditor } from '../../editors/maintenance/maintenance.component';
import { TaskComponent } from '../../editors/task/task.component';
@Component({
  selector: 'tc-quality-work-order',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    QualityNavComponent,
    PendingRequestsComponent,
    MaintenanceEditor,
  ],
  templateUrl: './work-order.component.html',
  styleUrl: './work-order.component.scss',
})
export class WorkOrderComponent extends QualityPage {
  readonly record = signal<M.WorkOrder | null>(null);
  readonly asset = signal<M.Asset | null>(null);
  readonly tasks = signal<M.Task[]>([]);
  readonly editorView = viewChild(MaintenanceEditor);
  get form() {
    return this.editorView()?.form;
  }
  readonly allCompleted = () =>
    this.tasks().length > 0 && this.tasks().every((t) => !!t.completedAt);
  ngOnInit() {
    if (this.route.snapshot.paramMap.has('uuid')) this.watch(() => this.load());
  }
  async load() {
    await this.request(
      async () => {
        const r = await this.get<M.WorkOrder>('/maintenance/' + this.id());
        return {
          r,
          a: await this.get<M.Asset>('/assets/' + r.assetUuid + '/summary'),
          t: await this.get<M.Task[]>('/maintenance/' + r.uuid + '/tasks'),
        };
      },
      (x) => {
        this.record.set(x.r);
        this.asset.set(x.a);
        this.tasks.set(x.t);
      },
    );
  }
  async task(row?: M.Task) {
    const r = this.record();
    if (!r) return;
    if (
      await this.editor(
        TaskComponent,
        { orderUuid: r.uuid, orderVersion: r.version, record: row },
        'Tarea de mantenimiento',
      )
    )
      await this.load();
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
