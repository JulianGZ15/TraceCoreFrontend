import { Component, signal, computed, TemplateRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PageHeading,
  ListContainer,
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
import { Model } from '../../models';
import { label } from '../../rules';
import { LookupComponent } from '../../components/lookup/lookup.component';
import { SectionNavigationComponent } from '../../components/section-navigation/section-navigation.component';
import { CatalogEditorComponent } from '../../editors/catalog-editor/catalog-editor.component';

@Component({
  selector: 'tc-equipment-models',
  imports: [
    PageHeading,
    ListContainer,
    Feedback,
    Pagination,
    RouterLink,
    ReactiveFormsModule,
    LookupComponent,
    SectionNavigationComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './models.component.html',
  styleUrl: './models.component.scss',
})
export class ModelsComponent extends EquipmentPage {
  readonly rows = signal<Model[]>([]);
  readonly offset = signal(0);
  readonly limit = signal(25);

  readonly filters = new FormGroup({
    categoryUuid: new FormControl('', { nonNullable: true }),
    manufacturerUuid: new FormControl('', { nonNullable: true }),
  });

  readonly drawerForm = new FormGroup({
    categoryUuid: new FormControl('', { nonNullable: true }),
    manufacturerUuid: new FormControl('', { nonNullable: true }),
  });

  readonly columns = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Nombre' },
    { key: 'categoryUuid', label: 'Categoría' },
    { key: 'manufacturerUuid', label: 'Fabricante OEM' },
    { key: 'registeredAt', label: 'Alta' },
  ];

  readonly filterDefs: FilterDef[] = [
    { key: 'categoryUuid', label: 'Categoría', group: 'Clasificación' },
    { key: 'manufacturerUuid', label: 'Fabricante OEM', group: 'Clasificación' },
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
        this.api.list<Model>('models', {
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
    this.filters.reset({ categoryUuid: '', manufacturerUuid: '' });
    void this.apply(0);
  }

  async openFilters(template: TemplateRef<unknown>) {
    const cur = this.filters.getRawValue();
    this.drawerForm.reset(cur);

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de modelos',
      subtitle: 'Categoría y fabricante OEM',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.filters.patchValue(draft);
        void this.apply(0);
      },
      onClear: () => {
        this.drawerForm.reset({ categoryUuid: '', manufacturerUuid: '' });
      },
    });
  }

  onLookupPicked(key: string, item: any) {
    if (item && item.uuid) {
      const name = item.code || item.name || item.legalName || item.tradeName || item.uuid;
      this.resolvedLabels.set(item.uuid, name);
    }
  }

  async edit(row?: Model) {
    if (!this.session.can('EQUIPMENT_MANAGE')) return;
    const result = await this.editor(CatalogEditorComponent, {
      title: row ? 'Editar registro' : 'Nuevo modelo',
      path: 'models',
      kind: 'models',
      row,
      reload: row ? () => this.api.model(row.uuid) : undefined,
    });
    if (result && this.alive && this.session.valid()) {
      this.success.set('Registro guardado.');
      await this.load();
    }
  }

  value(row: Model, key: string) {
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
