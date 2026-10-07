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
import { Lot } from '../../models';
import { label } from '../../rules';
import { SectionNavigationComponent } from '../../components/section-navigation/section-navigation.component';
import { CatalogEditorComponent } from '../../editors/catalog-editor/catalog-editor.component';

@Component({
  selector: 'tc-equipment-lots',
  imports: [
    Feedback,
    Pagination,
    RouterLink,
    ReactiveFormsModule,
    SectionNavigationComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './lots.component.html',
  styleUrl: './lots.component.scss',
})
export class LotsComponent extends EquipmentPage {
  readonly rows = signal<Lot[]>([]);
  readonly offset = signal(0);
  readonly limit = signal(25);

  readonly filters = new FormGroup({
    type: new FormControl('', { nonNullable: true }),
  });

  readonly drawerForm = new FormGroup({
    type: new FormControl('', { nonNullable: true }),
  });

  readonly columns = [
    { key: 'code', label: 'Código' },
    { key: 'type', label: 'Tipo' },
    { key: 'origin', label: 'Origen' },
    { key: 'description', label: 'Descripción' },
  ];

  readonly filterDefs: FilterDef[] = [
    {
      key: 'type',
      label: 'Tipo de lote',
      format: (v) => label(v),
    },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues()));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  constructor() {
    super();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const values: Record<string, string> = {
        type: params.get('type') ?? '',
      };
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
        this.api.list<Lot>('lots', {
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
    this.filters.reset({ type: '' });
    void this.apply(0);
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset(this.filters.getRawValue());

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de lotes',
      subtitle: 'Tipo de lote y clasificación',
      template,
      onApply: () => {
        this.filters.patchValue(this.drawerForm.getRawValue());
        void this.apply(0);
      },
      onClear: () => {
        this.drawerForm.reset({ type: '' });
      },
    });
  }

  setDraftType(val: string) {
    this.drawerForm.controls.type.setValue(val);
  }

  value(row: Lot, key: string) {
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

  async edit(row?: Lot) {
    if (!this.session.can('EQUIPMENT_MANAGE')) return;
    const result = await this.editor(CatalogEditorComponent, {
      title: row ? 'Editar registro' : 'Nuevo lote',
      path: 'lots',
      kind: 'lots',
      row,
      reload: row ? () => this.api.lot(row.uuid) : undefined,
    });
    if (result && this.alive && this.session.valid()) {
      this.success.set('Registro guardado.');
      await this.load();
    }
  }
}
