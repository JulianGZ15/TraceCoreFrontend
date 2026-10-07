import { Component, signal, computed, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
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
import { QualityPage } from '../../page-base';
import { QualityNavComponent } from '../../shared/quality-nav/quality-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import * as M from '../../models';

@Component({
  selector: 'tc-quality-assets',
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    PageHeading,
    ListContainer,
    Feedback,
    Pagination,
    QualityNavComponent,
    PendingRequestsComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
})
export class AssetsComponent extends QualityPage {
  readonly rows = signal<M.Asset[]>([]);
  search = '';
  lifecycle = '';

  readonly drawerForm = new FormGroup({
    lifecycle: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'lifecycle', label: 'Ciclo de vida', format: (v) => this.label(v) },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues()));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  ngOnInit() {
    this.watch(() => {
      const q = this.route.snapshot.queryParamMap;
      this.search = q.get('search') ?? '';
      this.lifecycle = q.get('lifecycle') ?? '';

      const cur: Record<string, string> = {};
      if (this.lifecycle) cur['lifecycle'] = this.lifecycle;
      this.currentValues.set(cur);

      return this.load();
    });
  }

  async load() {
    await this.request(
      () =>
        this.get<M.Asset[]>('/assets', {
          yardUuid: this.yard(),
          search: this.search,
          lifecycle: this.lifecycle,
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => this.rows.set(r),
    );
  }

  onSearch(term: string) {
    this.filter({ search: term.trim() || null, offset: '0' });
  }

  onRemoveChip(chip: FilterChip) {
    const patch: Record<string, string | null> = { offset: '0' };
    for (const k of chip.keys) {
      patch[k] = null;
    }
    this.filter(patch);
  }

  onClearAll() {
    this.filter({
      search: null,
      lifecycle: null,
      offset: '0',
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({ lifecycle: this.lifecycle });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de equipos (calidad)',
      subtitle: 'Ciclo de vida y estado técnico',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.filter({
          lifecycle: draft.lifecycle || null,
          offset: '0',
        });
      },
      onClear: () => {
        this.drawerForm.reset({ lifecycle: '' });
      },
    });
  }

  setDraftLifecycle(val: string) {
    this.drawerForm.controls.lifecycle.setValue(val);
  }
}
