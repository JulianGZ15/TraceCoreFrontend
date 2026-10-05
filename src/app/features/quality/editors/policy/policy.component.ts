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
  selector: 'tc-quality-policy-editor',
  imports: [ReactiveFormsModule, PageHeading, Feedback, OptionPickerComponent],
  templateUrl: './policy.component.html',
  styleUrl: './policy.component.scss',
})
export class PolicyComponent extends QualityEditor {
  readonly operationCapability = 'QUALITY_MANAGE';
  override readonly companyOperation = true;
  readonly pending = inject(QualityPending);
  readonly form = this.fb.group({
    target: ['MODEL', this.required],
    modelUuid: [''],
    categoryUuid: [''],
    standardUuid: ['', this.uuid],
    revision: ['', this.required],
    method: ['', [this.required, Validators.pattern(/^[A-Za-z][A-Za-z0-9_:-]{0,79}$/)]],
    calendarDays: [null as number | null, Validators.min(1)],
    hourInterval: ['', signedValidator],
    validFrom: ['', this.required],
    validTo: [''],
    requireMtr: [false],
    requireCertification: [false],
    criteria: this.fb.array<FormGroup>([]),
  });
  record: M.Policy | null = null;
  get criteria() {
    return this.form.controls.criteria;
  }
  addCriterion() {
    this.criteria.push(
      this.fb.group({
        parameter: ['', this.required],
        unit: ['', this.required],
        minimum: ['', signedValidator],
        maximum: ['', signedValidator],
      }),
    );
    this.form.markAsDirty();
  }
  ngOnInit() {
    this.form.addValidators((g) => {
      const r = g.getRawValue();
      if (
        !(r.target === 'MODEL' ? r.modelUuid : r.categoryUuid) ||
        (!r.calendarDays && !r.hourInterval)
      )
        return { policy: true };
      try {
        if (r.hourInterval && scaled(r.hourInterval) <= 0n) return { interval: true };
        const names = new Set<string>();
        for (const c of r.criteria) {
          const name = c['parameter'].trim().toUpperCase();
          if (
            names.has(name) ||
            (!c['minimum'] && !c['maximum']) ||
            (c['minimum'] && c['maximum'] && scaled(c['minimum']) > scaled(c['maximum']))
          )
            return { criteria: true };
          names.add(name);
        }
        return null;
      } catch {
        return { decimal: true };
      }
    });
    const id = this.route.snapshot.paramMap.get('uuid');
    if (id) void this.loadRecord(id);
  }
  async loadRecord(id: string) {
    this.compatible.set(false);
    await this.request(
      () => this.get<M.Policy>('/policies/' + id),
      (r) => {
        if (r.state !== 'DRAFT') throw new Error('Solo un borrador permite edición.');
        this.record = r;
        this.criteria.clear();
        for (const c of r.criteria) {
          this.addCriterion();
          this.criteria.at(-1).reset({
            parameter: c['parameter'],
            unit: c['unit'],
            minimum: optionalExact(c['minimum'], c.minimumExact) ?? '',
            maximum: optionalExact(c['maximum'], c.maximumExact) ?? '',
          });
        }
        const { criteria: _criteria, ...identity } = r;
        this.form.patchValue({
          ...identity,
          target: r.modelUuid ? 'MODEL' : 'CATEGORY',
          modelUuid: r.modelUuid ?? '',
          categoryUuid: r.categoryUuid ?? '',
          hourInterval: optionalExact(r.hourInterval, r.hourIntervalExact) ?? '',
        });
        this.form.markAsPristine();
        this.compatible.set(true);
      },
    );
  }
  async reload() {
    if (this.record && (await this.discard())) await this.loadRecord(this.record.uuid);
  }
  async save() {
    await this.saveWith(async () => {
      const r = this.form.getRawValue();
      const payload = {
        modelUuid: r.target === 'MODEL' ? r.modelUuid : null,
        categoryUuid: r.target === 'CATEGORY' ? r.categoryUuid : null,
        standardUuid: r.standardUuid,
        revision: r.revision,
        method: r.method,
        calendarDays: r.calendarDays || null,
        hourInterval: r.hourInterval || null,
        requireMtr: r.requireMtr,
        requireCertification: r.requireCertification,
        validFrom: toInstant(r.validFrom!),
        validTo: r.validTo ? toInstant(r.validTo) : null,
        criteria: r.criteria.map((c) => ({
          parameter: c['parameter'],
          unit: c['unit'],
          minimum: c['minimum'] || null,
          maximum: c['maximum'] || null,
        })),
      };
      return this.record
        ? this.api.put<M.Policy>('/policies/' + this.record.uuid, {
            ...payload,
            version: this.record.version,
          })
        : this.api.post<M.Policy>('/policies', payload);
    });
  }
}
