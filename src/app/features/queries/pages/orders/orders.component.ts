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

@Component({
  selector: 'tc-query-orders',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    RecordValuesComponent,
    FilterPickerComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent extends ReadPage {
  readonly dialog = inject(Dialog);
  readonly access = inject(QueryAccess);
  readonly csv = new CsvDownload(this.api);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly hasMore = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    yardUuid: '',
    partyUuid: '',
    assetUuid: '',
    type: '',
    state: '',
    currency: '',
    from: '',
    to: '',
  });

  readonly drawerForm = new FormGroup({
    type: new FormControl('', { nonNullable: true }),
    state: new FormControl('', { nonNullable: true }),
    currency: new FormControl('', { nonNullable: true }),
    partyUuid: new FormControl('', { nonNullable: true }),
    assetUuid: new FormControl('', { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'type', label: 'Tipo' },
    {
      key: 'state',
      label: 'Estado',
      format: (v) =>
        v === 'DRAFT'
          ? 'Borrador'
          : v === 'APPROVED'
            ? 'Aprobada'
            : v === 'CLOSED'
              ? 'Cerrada'
              : v === 'CANCELLED'
                ? 'Cancelada'
                : v,
    },
    { key: 'currency', label: 'Divisa' },
    { key: 'partyUuid', label: 'UUID tercero' },
    { key: 'assetUuid', label: 'UUID equipo' },
    { key: 'from', label: 'Desde' },
    { key: 'to', label: 'Hasta' },
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
    for (const k of ['type', 'state', 'currency', 'partyUuid', 'assetUuid', 'from', 'to']) {
      const val = (values as any)[k];
      if (val) drawerValues[k] = val;
    }
    this.currentFilterValues.set(drawerValues);

    await this.read(
      () => {
        validateFilters(values);
        return this.api.get<Page<Record<string, unknown>>>(
          '/queries/orders',
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
      type: '',
      state: '',
      currency: '',
      partyUuid: '',
      assetUuid: '',
      from: '',
      to: '',
    });
    this.apply();
  }

  async openFilters(template: TemplateRef<unknown>) {
    const cur = this.form.getRawValue();
    this.drawerForm.reset({
      type: cur.type,
      state: cur.state,
      currency: cur.currency,
      partyUuid: cur.partyUuid,
      assetUuid: cur.assetUuid,
      from: cur.from,
      to: cur.to,
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de consulta de órdenes',
      subtitle: 'Tipo, estado, divisa, contraparte y fechas',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.form.patchValue(draft);
        this.apply();
      },
      onClear: () => {
        this.drawerForm.reset({
          type: '',
          state: '',
          currency: '',
          partyUuid: '',
          assetUuid: '',
          from: '',
          to: '',
        });
      },
    });
  }

  setDraftType(val: string) {
    this.drawerForm.controls.type.setValue(val);
  }

  setDraftState(val: string) {
    this.drawerForm.controls.state.setValue(val);
  }

  canExport() {
    return this.access.can('QUERY_EXPORT', String(this.applied['yardUuid'] ?? ''));
  }

  export(next = false) {
    void this.csv.download('/queries/exports/orders.csv', this.applied, next);
  }

  override ngOnDestroy() {
    this.csv.destroy();
    super.ngOnDestroy();
  }
}
