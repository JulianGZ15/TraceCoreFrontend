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
  selector: 'tc-quality-results',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    QualityNavComponent,
    PendingRequestsComponent,
    EvidencePickerComponent,
  ],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss',
})
export class ResultsComponent extends QualityPage {
  readonly compatible = signal(false);
  readonly fb = inject(FormBuilder);
  readonly record = signal<M.Inspection | null>(null);
  readonly asset = signal<M.Asset | null>(null);
  readonly form = this.fb.group({
    performedAt: ['', Validators.required],
    verdict: ['PASS', Validators.required],
    findings: ['', Validators.required],
    evidenceUuid: ['', Validators.required],
    measurements: this.fb.array<FormGroup>([]),
  });
  get measurements() {
    return this.form.controls.measurements;
  }
  protected override clear() {
    this.form.reset();
    this.measurements.clear();
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    this.compatible.set(false);
    await this.request(
      async () => {
        const r = await this.get<M.Inspection>('/inspections/' + this.id());
        return { r, a: await this.get<M.Asset>('/assets/' + r.assetUuid + '/summary') };
      },
      (x) => {
        if (x.r.state !== 'PLANNED')
          throw new Error('Los resultados de esta inspección están congelados.');
        if (x.r.inspectorUuid !== this.session.user()?.uuid)
          throw new Error('Solo el inspector asignado puede registrar los resultados.');
        this.record.set(x.r);
        this.asset.set(x.a);
        this.measurements.clear();
        for (const c of x.r.criteria) {
          optionalExact(c.minimum, c.minimumExact);
          optionalExact(c.maximum, c.maximumExact);
          this.measurements.push(
            this.fb.group({
              parameter: [c.parameter],
              unit: [c.unit],
              value: ['', [Validators.required, signedValidator]],
            }),
          );
        }
        this.form.markAsPristine();
        this.compatible.set(true);
      },
    );
  }
  async reload() {
    if (await this.discard()) await this.load();
  }
  async save() {
    const r = this.record();
    this.form.markAllAsTouched();
    if (!r || this.form.invalid || !this.compatible()) return;
    await this.mutate(
      () =>
        this.api.post<M.Inspection>('/inspections/' + r.uuid + '/record?version=' + r.version, {
          ...this.form.getRawValue(),
          performedAt: toInstant(this.form.controls.performedAt.value!),
        }),
      async () => {
        this.form.markAsPristine();
        await this.router.navigate(['/calidad/inspecciones', r.uuid]);
      },
    );
  }
}
