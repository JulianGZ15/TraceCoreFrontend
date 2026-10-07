import {
  Component,
  signal,
  computed,
  TemplateRef,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';
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
import { Asset } from '../../models';
import { label } from '../../rules';
import { LookupComponent } from '../../components/lookup/lookup.component';

@Component({
  selector: 'tc-equipment-assets',
  imports: [
    Feedback,
    Pagination,
    RouterLink,
    ReactiveFormsModule,
    LookupComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
})
export class AssetsComponent extends EquipmentPage {
  readonly rows = signal<Asset[]>([]);
  readonly offset = signal(0);
  readonly limit = signal(25);

  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    categoryUuid: new FormControl('', { nonNullable: true }),
    modelUuid: new FormControl('', { nonNullable: true }),
    lifecycle: new FormControl('', { nonNullable: true }),
  });

  readonly drawerForm = new FormGroup({
    categoryUuid: new FormControl('', { nonNullable: true }),
    modelUuid: new FormControl('', { nonNullable: true }),
    lifecycle: new FormControl('', { nonNullable: true }),
  });

  readonly columns = [
    { key: 'internalCode', label: 'Marcación' },
    { key: 'serialNumber', label: 'Serial OEM' },
    { key: 'sheetUuid', label: 'Ficha UUID' },
    { key: 'lifecycle', label: 'Ciclo de vida' },
    { key: 'registeredAt', label: 'Alta' },
  ];

  readonly modelFilters = signal<Record<string, string | number>>({});
  readonly drawerModelFilters = signal<Record<string, string | number>>({});

  readonly filterDefs: FilterDef[] = [
    { key: 'search', label: 'Marcación o serial', kind: 'primary' },
    { key: 'categoryUuid', label: 'Categoría', group: 'Clasificación' },
    { key: 'modelUuid', label: 'Modelo', group: 'Clasificación' },
    {
      key: 'lifecycle',
      label: 'Ciclo de vida',
      group: 'Ciclo de vida',
      format: (v) => label(v),
    },
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

    this.filters.controls.categoryUuid.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.modelFilters.set(value ? { categoryUuid: value } : {}));

    this.drawerForm.controls.categoryUuid.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.drawerModelFilters.set(value ? { categoryUuid: value } : {}));
  }

  async load() {
    await this.request(
      () =>
        this.api.list<Asset>('assets', {
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

  onSearch(term: string) {
    this.filters.controls.search.setValue(term);
    void this.apply(0);
  }

  onRemoveChip(chip: FilterChip) {
    for (const k of chip.keys) {
      this.filters.get(k)?.setValue('');
    }
    void this.apply(0);
  }

  onClearAll() {
    this.filters.controls.categoryUuid.setValue('');
    this.filters.controls.modelUuid.setValue('');
    this.filters.controls.lifecycle.setValue('');
    void this.apply(0);
  }

  async openFilters(template: TemplateRef<unknown>) {
    const cur = this.filters.getRawValue();
    this.drawerForm.reset({
      categoryUuid: cur.categoryUuid,
      modelUuid: cur.modelUuid,
      lifecycle: cur.lifecycle,
    });
    this.drawerModelFilters.set(cur.categoryUuid ? { categoryUuid: cur.categoryUuid } : {});

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de equipos',
      subtitle: 'Clasificación técnica y ciclo de vida',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.filters.patchValue(draft);
        void this.apply(0);
      },
      onClear: () => {
        this.drawerForm.reset({ categoryUuid: '', modelUuid: '', lifecycle: '' });
      },
    });
  }

  onLookupPicked(key: string, item: any) {
    if (item && item.uuid) {
      const name = item.code || item.internalCode || item.name || item.description || item.uuid;
      this.resolvedLabels.set(item.uuid, name);
    }
  }

  value(row: Asset, key: string) {
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
