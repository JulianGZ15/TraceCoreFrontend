import { Component, signal, computed, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

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
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { SiteEditorComponent } from '../../editors/site-editor/site-editor.component';

@Component({
  selector: 'tc-inventory-sites',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    InventoryNavComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './sites.component.html',
  styleUrl: './sites.component.scss',
})
export class SitesComponent extends InventoryPage {
  readonly rows = signal<M.Site[]>([]);
  active = '';

  readonly drawerForm = new FormGroup({
    active: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    {
      key: 'active',
      label: 'Estado',
      format: (v) => (v === 'true' ? 'Activos' : v === 'false' ? 'Inactivos' : ''),
    },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues()));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  ngOnInit() {
    this.watch(() => {
      this.active = this.route.snapshot.queryParamMap.get('active') ?? '';
      const cur: Record<string, string> = {};
      if (this.active) cur['active'] = this.active;
      this.currentValues.set(cur);
      return this.load();
    });
  }

  async load() {
    await this.request(
      () =>
        this.api.get<M.Site[]>('/sites', {
          offset: this.offset(),
          limit: this.limit(),
          active: this.active || null,
        }),
      (r) => this.rows.set(r),
    );
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
      active: null,
      offset: 0,
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({ active: this.active });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de sitios',
      subtitle: 'Estado operativo del sitio',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.query({
          active: draft.active || null,
          offset: 0,
        });
      },
      onClear: () => {
        this.drawerForm.reset({ active: '' });
      },
    });
  }

  setDraftActive(val: string) {
    this.drawerForm.controls.active.setValue(val);
  }

  async create() {
    const r = await this.editor(SiteEditorComponent, {}, 'Alta de sitio');
    if (r) await this.load();
  }
}
