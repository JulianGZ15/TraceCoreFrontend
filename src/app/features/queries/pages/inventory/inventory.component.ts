import { Component, inject, signal, computed, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { ReadPage } from '../../../../shared/ui/read-page';
import {
  PageHeading,
  Feedback,
  Pagination,
  SearchToolbar,
  FilterSection,
  openFilterDrawer,
  FilterDef,
  FilterChip,
  chipsFor,
  activeCount,
} from '../../../../shared/ui/page';
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
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent extends ReadPage {
  readonly dialog = inject(Dialog);
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

  readonly drawerForm = new FormGroup({
    lifecycle: new FormControl('', { nonNullable: true }),
    modelUuid: new FormControl('', { nonNullable: true }),
    categoryUuid: new FormControl('', { nonNullable: true }),
    assetUuid: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    {
      key: 'lifecycle',
      label: 'Ciclo de vida',
      format: (v) => (v === 'ACTIVE' ? 'Activo' : v === 'RETIRED' ? 'Retirado' : v),
    },
    { key: 'modelUuid', label: 'Modelo' },
    { key: 'categoryUuid', label: 'Categoría' },
    { key: 'assetUuid', label: 'UUID equipo' },
  ];

  readonly currentFilterValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentFilterValues()));
  readonly activeFilterCount = computed(() =>
    activeCount(this.filterDefs, this.currentFilterValues()),
  );

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

    const drawerValues: Record<string, string> = {};
    if (values.lifecycle) drawerValues['lifecycle'] = values.lifecycle;
    if (values.modelUuid) drawerValues['modelUuid'] = values.modelUuid;
    if (values.categoryUuid) drawerValues['categoryUuid'] = values.categoryUuid;
    if (values.assetUuid) drawerValues['assetUuid'] = values.assetUuid;
    this.currentFilterValues.set(drawerValues);

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

  onSearch(term: string) {
    this.form.controls.search.setValue(term.trim());
    this.apply();
  }

  onYardChange(yard: string) {
    this.form.controls.yardUuid.setValue(yard);
    this.apply();
  }

  onRemoveChip(chip: FilterChip) {
    for (const k of chip.keys) {
      if (k in this.form.controls) {
        (this.form.controls as any)[k].setValue('');
      }
    }
    this.apply();
  }

  onClearAll() {
    this.form.patchValue({
      search: '',
      lifecycle: '',
      modelUuid: '',
      categoryUuid: '',
      assetUuid: '',
    });
    this.apply();
  }

  async openFilters(template: TemplateRef<unknown>) {
    const cur = this.form.getRawValue();
    this.drawerForm.reset({
      lifecycle: cur.lifecycle,
      modelUuid: cur.modelUuid,
      categoryUuid: cur.categoryUuid,
      assetUuid: cur.assetUuid,
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de inventario',
      subtitle: 'Ciclo de vida, modelo, categoría y activos',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.form.patchValue({
          lifecycle: draft.lifecycle,
          modelUuid: draft.modelUuid,
          categoryUuid: draft.categoryUuid,
          assetUuid: draft.assetUuid,
        });
        this.apply();
      },
      onClear: () => {
        this.drawerForm.reset({
          lifecycle: '',
          modelUuid: '',
          categoryUuid: '',
          assetUuid: '',
        });
      },
    });
  }

  setDraftLifecycle(val: string) {
    this.drawerForm.controls.lifecycle.setValue(val);
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
