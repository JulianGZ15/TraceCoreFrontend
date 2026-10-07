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
  selector: 'tc-inventory-assets',
  imports: [
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
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
})
export class AssetsComponent extends InventoryPage {
  readonly rows = signal<M.AssetRow[]>([]);
  search = '';
  placement = '';
  rootsOnly = false;

  readonly drawerForm = new FormGroup({
    placementState: new FormControl('', { nonNullable: true }),
    rootsOnly: new FormControl(false, { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    {
      key: 'placementState',
      label: 'Situación',
      format: (v) => this.label(v),
    },
    {
      key: 'rootsOnly',
      label: 'Jerarquía',
      format: () => 'Solo raíces',
    },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues()));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  ngOnInit() {
    this.watch(() => {
      const q = this.route.snapshot.queryParamMap;
      this.search = q.get('search') ?? '';
      this.placement = q.get('placementState') ?? '';
      this.rootsOnly = q.get('rootsOnly') === 'true';

      const cur: Record<string, string> = {};
      if (this.placement) cur['placementState'] = this.placement;
      if (this.rootsOnly) cur['rootsOnly'] = 'true';
      this.currentValues.set(cur);

      return this.load();
    });
  }

  async load() {
    await this.request(
      () =>
        this.api.get<M.AssetRow[]>(
          '/assets',
          this.params({
            search: this.search.trim() || null,
            placementState: this.placement || null,
            rootsOnly: this.rootsOnly,
            locationUuid: this.route.snapshot.queryParamMap.get('locationUuid'),
          }),
        ),
      (r) => this.rows.set(r),
    );
  }

  onSearchChange(text: string) {
    this.query({
      search: text.trim() || null,
      offset: 0,
    });
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
      search: null,
      placementState: null,
      rootsOnly: null,
      offset: 0,
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({
      placementState: this.placement,
      rootsOnly: this.rootsOnly,
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de equipos',
      subtitle: 'Situación física y jerarquía en patio',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.query({
          placementState: draft.placementState || null,
          rootsOnly: draft.rootsOnly ? 'true' : null,
          offset: 0,
        });
      },
      onClear: () => {
        this.drawerForm.reset({ placementState: '', rootsOnly: false });
      },
    });
  }

  setDraftPlacement(val: string) {
    this.drawerForm.controls.placementState.setValue(val);
  }
}
