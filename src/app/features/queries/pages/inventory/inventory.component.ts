import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ReadPage } from '../../../../shared/ui/read-page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordValuesComponent } from '../../../../shared/ui/record-values/record-values.component';
import { Page, Params } from '../../../../core/http/workspace-api';
import { QueryAccess } from '../../access';
import { CsvDownload } from '../../csv';
import { validateFilters } from '../../filters';
import { FilterPickerComponent } from '../../shared/filter-picker/filter-picker.component';
import { InventoryRow } from '../../models';
@Component({
  selector: 'tc-query-inventory',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    FilterPickerComponent,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent extends ReadPage {
  readonly access = inject(QueryAccess);
  readonly csv = new CsvDownload(this.api);
  readonly rows = signal<InventoryRow[]>([]);
  readonly hasMore = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    yardUuid: '',
    assetUuid: '',
    modelUuid: '',
    categoryUuid: '',
    lifecycle: '',
    search: '',
  });
  applied: Params = {};
  override async load() {
    const q = this.route.snapshot.queryParamMap;
    const values = { ...this.form.getRawValue() };
    for (const key of Object.keys(values))
      values[key as keyof typeof values] =
        q.get(key) ?? (key === 'yardUuid' ? this.session.selectedYard() : '');
    this.form.patchValue(values);
    this.applied = values;
    this.csv.reset();
    await this.read(
      () => {
        validateFilters(values);
        return this.api.get<Page<InventoryRow>>(
          '/queries/inventory',
          { ...values, offset: this.offset, limit: this.limit },
          this.stop,
        );
      },
      (r) => {
        this.rows.set(r.items);
        this.hasMore.set(r.hasMore);
      },
    );
  }
  override clear() {
    this.rows.set([]);
    this.csv.reset();
  }
  apply() {
    try {
      validateFilters(this.form.getRawValue());
      void this.change({ ...this.form.getRawValue(), offset: 0 });
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
  canExport() {
    return this.access.can('QUERY_EXPORT', String(this.applied['yardUuid'] ?? ''));
  }
  export(next = false) {
    void this.csv.download('/queries/exports/inventory.csv', this.applied, next);
  }
  override ngOnDestroy() {
    this.csv.destroy();
    super.ngOnDestroy();
  }
}
