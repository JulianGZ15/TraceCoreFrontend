import { Skeleton } from '../../../../shared/ui/skeleton/skeleton.component';
import { DataTable } from '../../../../shared/ui/data-table/data-table.component';
import { Component, signal, computed, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

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
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-movements',
  imports: [
    Skeleton,
    DataTable,
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    ListContainer,
    Feedback,
    Pagination,
    YardPickerComponent,
    InventoryNavComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './movements.component.html',
  styleUrl: './movements.component.scss',
})
export class MovementsComponent extends InventoryPage {
  readonly rows = signal<M.Movement[]>([]);
  readonly siteLabels = signal<Record<string, string>>({});
  state = '';

  readonly drawerForm = new FormGroup({
    state: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    {
      key: 'state',
      label: 'Estado',
      format: (v) => this.label(v),
    },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues()));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  ngOnInit() {
    this.watch(() => {
      this.state = this.route.snapshot.queryParamMap.get('state') ?? '';
      const cur: Record<string, string> = {};
      if (this.state) cur['state'] = this.state;
      this.currentValues.set(cur);
      return this.load();
    });
  }

  async load() {
    const loaded = await this.request(
      () => this.api.get<M.Movement[]>('/movements', this.params({ state: this.state || null })),
      (r) => this.rows.set(r),
    );
    if (!loaded) return;
    const siteUuids = [
      ...new Set(
        this.rows()
          .flatMap((row) => [row.sourceSiteUuid, row.destinationSiteUuid])
          .filter((uuid): uuid is string => !!uuid && !(uuid in this.siteLabels())),
      ),
    ];
    await Promise.all(
      siteUuids.map(async (uuid) => {
        try {
          const site = await this.api.get<M.Site>('/sites/' + uuid);
          this.siteLabels.update((labels) => ({ ...labels, [uuid]: `${site.code} · ${site.name}` }));
        } catch {
          this.siteLabels.update((labels) => ({ ...labels, [uuid]: 'Sitio externo no disponible' }));
        }
      }),
    );
  }

  locationName(yardUuid: string | null, siteUuid: string | null, empty: string) {
    if (yardUuid) {
      const yard = this.session.context()?.yards.find((item) => item.uuid === yardUuid);
      return yard ? `${yard.code} · ${yard.name}` : 'Patio no disponible';
    }
    if (siteUuid) return this.siteLabels()[siteUuid] ?? 'Sitio externo';
    return empty;
  }

  onRemoveChip(chip: FilterChip) {
    const patch: Record<string, string | number | null> = { offset: 0 };
    for (const k of chip.keys) {
      patch[k] = null;
    }
    this.query(patch);
  }

  onClearAll() {
    this.query({
      state: null,
      offset: 0,
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({ state: this.state });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de movimientos',
      subtitle: 'Estado operativo del traslado',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.query({
          state: draft.state || null,
          offset: 0,
        });
      },
      onClear: () => {
        this.drawerForm.reset({ state: '' });
      },
    });
  }

  setDraftState(val: string) {
    this.drawerForm.controls.state.setValue(val);
  }
}
