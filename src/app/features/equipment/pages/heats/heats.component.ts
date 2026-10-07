import { Component, signal, computed, TemplateRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
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
import { EquipmentPage } from '../../page-base';
import { Heat } from '../../models';
import { label } from '../../rules';
import { LookupComponent } from '../../components/lookup/lookup.component';
import { SectionNavigationComponent } from '../../components/section-navigation/section-navigation.component';
import { CatalogEditorComponent } from '../../editors/catalog-editor/catalog-editor.component';

@Component({
  selector: 'tc-equipment-heats',
  imports: [
    Feedback,
    Pagination,
    ReactiveFormsModule,
    LookupComponent,
    SectionNavigationComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './heats.component.html',
  styleUrl: './heats.component.scss',
})
export class HeatsComponent extends EquipmentPage {
  readonly rows = signal<Heat[]>([]);
  readonly offset = signal(0);
  readonly limit = signal(25);

  readonly filters = new FormGroup({
    millUuid: new FormControl('', { nonNullable: true }),
    gradeUuid: new FormControl('', { nonNullable: true }),
  });

  readonly drawerForm = new FormGroup({
    millUuid: new FormControl('', { nonNullable: true }),
    gradeUuid: new FormControl('', { nonNullable: true }),
  });

  readonly columns = [
    { key: 'heatNumber', label: 'Número de colada' },
    { key: 'millUuid', label: 'Molino' },
    { key: 'gradeUuid', label: 'Grado' },
    { key: 'registeredAt', label: 'Alta' },
  ];

  readonly filterDefs: FilterDef[] = [
    { key: 'millUuid', label: 'Molino / fundidor', group: 'Material y procedencia' },
    { key: 'gradeUuid', label: 'Grado', group: 'Material y procedencia' },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly resolvedLabels = new Map<string, string>();
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues(), this.resolvedLabels));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  constructor() {
    super();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const values: Record<string, string> = {};
      for (const key of Object.keys(this.filters.controls)) {
        values[key] = params.get(key) ?? '';
      }
      this.filters.reset(values);
      this.currentValues.set(values);
      this.offset.set(Math.max(0, Number(params.get('offset')) || 0));
      this.limit.set(Math.min(100, Math.max(1, Number(params.get('limit')) || 25)));
      void this.load();
    });
  }

  async load() {
    await this.request(
      () =>
        this.api.list<Heat>('heats', {
          ...this.query(),
          offset: this.offset(),
          limit: this.limit(),
        }),
      (rows) => this.rows.set(rows),
    );
  }

  query() {
    const result: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(this.filters.getRawValue())) {
      if (value) result[key] = value as string;
    }
    return result;
  }

  apply(offset = 0) {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.query(), offset, limit: this.limit() },
    });
  }

  resize(limit: number) {
    this.limit.set(limit);
    void this.apply(0);
  }

  onRemoveChip(chip: FilterChip) {
    for (const k of chip.keys) {
      this.filters.get(k)?.setValue('');
    }
    void this.apply(0);
  }

  onClearAll() {
    this.filters.reset({ millUuid: '', gradeUuid: '' });
    void this.apply(0);
  }

  async openFilters(template: TemplateRef<unknown>) {
    const cur = this.filters.getRawValue();
    this.drawerForm.reset(cur);

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de coladas',
      subtitle: 'Molino y grado del material',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.filters.patchValue(draft);
        void this.apply(0);
      },
      onClear: () => {
        this.drawerForm.reset({ millUuid: '', gradeUuid: '' });
      },
    });
  }

  onLookupPicked(key: string, item: any) {
    if (item && item.uuid) {
      const name = item.code || item.name || item.legalName || item.tradeName || item.uuid;
      this.resolvedLabels.set(item.uuid, name);
    }
  }

  async edit(row?: Heat) {
    if (!this.session.can('EQUIPMENT_MANAGE')) return;
    const result = await this.editor(CatalogEditorComponent, {
      title: row ? 'Editar registro' : 'Nueva colada',
      path: 'heats',
      kind: 'heats',
      row,
      reload: row ? () => this.api.lot(row.uuid) : undefined,
    });
    if (result && this.alive && this.session.valid()) {
      this.success.set('Registro guardado.');
      await this.load();
    }
  }

  value(row: Heat, key: string) {
    const value = (row as unknown as Record<string, unknown>)[key];
    return typeof value === 'boolean'
      ? value
        ? 'Sí'
        : 'No'
      : key === 'registeredAt'
        ? this.date(value as string)
        : value == null
          ? 'Sin dato'
          : label(String(value));
  }
}
