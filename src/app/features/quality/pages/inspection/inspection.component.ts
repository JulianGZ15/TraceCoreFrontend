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
import { InspectionComponent as InspectionEditor } from '../../editors/inspection/inspection.component';
@Component({
  selector: 'tc-quality-inspection',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    QualityNavComponent,
    PendingRequestsComponent,
    InspectionEditor,
  ],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.scss',
})
export class InspectionComponent extends QualityPage {
  readonly failed = (m: M.Measurement) => m.result !== 'PASS';
  readonly record = signal<M.Inspection | null>(null);
  readonly asset = signal<M.Asset | null>(null);
  readonly measures = signal<M.Measurement[]>([]);
  readonly editorView = viewChild(InspectionEditor);
  get form() {
    return this.editorView()?.form;
  }
  ngOnInit() {
    if (this.route.snapshot.paramMap.has('uuid')) this.watch(() => this.load());
  }
  async load() {
    await this.request(
      async () => {
        const r = await this.get<M.Inspection>('/inspections/' + this.id());
        return {
          r,
          a: await this.get<M.Asset>('/assets/' + r.assetUuid + '/summary'),
          m:
            r.state === 'PLANNED'
              ? []
              : await this.get<M.Measurement[]>('/inspections/' + r.uuid + '/measurements'),
        };
      },
      (x) => {
        this.record.set(x.r);
        this.asset.set(x.a);
        this.measures.set(x.m);
      },
    );
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
