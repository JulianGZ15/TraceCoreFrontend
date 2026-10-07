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
import { Page } from '../../../../core/http/workspace-api';
import { QueryAccess } from '../../../queries/access';
import { validateFilters } from '../../../queries/filters';

@Component({
  selector: 'tc-support-receipts',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    RecordValuesComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.scss',
})
export class ReceiptsComponent extends ReadPage {
  readonly dialog = inject(Dialog);
  readonly access = inject(QueryAccess);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly selected = signal<Record<string, unknown> | null>(null);
  readonly hasMore = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    yardUuid: '',
    assetUuid: '',
    status: '',
    from: '',
    to: '',
  });

  readonly drawerForm = new FormGroup({
    assetUuid: new FormControl('', { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'assetUuid', label: 'UUID equipo' },
    { key: 'from', label: 'Desde' },
    { key: 'to', label: 'Hasta' },
  ];

  readonly currentFilterValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentFilterValues()));
  readonly activeFilterCount = computed(() =>
    activeCount(this.filterDefs, this.currentFilterValues()),
  );

  override async load() {
    const q = this.route.snapshot.queryParamMap;
    const values = { ...this.form.getRawValue() };
    for (const key of Object.keys(values))
      values[key as keyof typeof values] =
        q.get(key) ?? (key === 'yardUuid' ? this.session.selectedYard() : '');
    this.form.patchValue(values);
    this.selected.set(null);

    const drawerValues: Record<string, string> = {};
    if (values.assetUuid) drawerValues['assetUuid'] = values.assetUuid;
    if (values.from) drawerValues['from'] = values.from;
    if (values.to) drawerValues['to'] = values.to;
    this.currentFilterValues.set(drawerValues);

    await this.read(
      () => {
        validateFilters(values);
        return this.api.get<Page<Record<string, unknown>>>(
          '/queries/support/rfid-receipts',
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
    this.selected.set(null);
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
    this.form.controls.status.setValue(term.trim());
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
      status: '',
      assetUuid: '',
      from: '',
      to: '',
    });
    this.apply();
  }

  async openFilters(template: TemplateRef<unknown>) {
    const cur = this.form.getRawValue();
    this.drawerForm.reset({
      assetUuid: cur.assetUuid,
      from: cur.from,
      to: cur.to,
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de recibos RFID',
      subtitle: 'Equipo y rango de fechas',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.form.patchValue(draft);
        this.apply();
      },
      onClear: () => {
        this.drawerForm.reset({
          assetUuid: '',
          from: '',
          to: '',
        });
      },
    });
  }
}
