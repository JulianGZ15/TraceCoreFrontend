import { Component, inject, input, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl, AbstractControl } from '@angular/forms';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import * as M from '../../models';
@Component({
  selector: 'tc-quality-evidence',
  imports: [ReactiveFormsModule, Feedback, Pagination],
  templateUrl: './evidence-picker.component.html',
  styleUrl: './evidence-picker.component.scss',
})
export class EvidencePickerComponent extends QualityPage {
  readonly control = input.required<AbstractControl>();
  readonly rows = signal<M.Evidence[]>([]);
  get field() {
    return this.control() as FormControl;
  }
  ngOnInit() {
    if (this.access.global('QUALITY_READ')) void this.load();
  }
  async load() {
    await this.request(
      () => this.get<M.Evidence[]>('/evidence', { offset: this.offset(), limit: this.limit() }),
      (r) => this.rows.set(r),
    );
  }
  move(n: number) {
    this.offset.set(n);
    void this.load();
  }
  select(row: M.Evidence) {
    this.field.setValue(row.uuid);
    this.field.markAsDirty();
  }
}
