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
import { RfidPage } from '../../page-base';
import { RfidNavComponent } from '../../shared/rfid-nav/rfid-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import * as M from '../../models';

@Component({
  selector: 'tc-rfid-assets',
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    PageHeading,
    ListContainer,
    Feedback,
    Pagination,
    RfidNavComponent,
    PendingRequestsComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
})
export class AssetsComponent extends RfidPage {
  readonly rows = signal<M.Asset[]>([]);
  readonly search = signal('');
  readonly lifecycle = signal('');

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
    this.watch(() => this.load());
  }

  async load() {
    const q = this.route.snapshot.queryParamMap;
    const s = q.get('search') ?? '';
    const l = q.get('lifecycle') ?? '';
    this.search.set(s);
    this.lifecycle.set(l);

    const cur: Record<string, string> = {};
    if (l) cur['lifecycle'] = l;
    this.currentValues.set(cur);

    await this.request(
      () =>
        this.get<M.Asset[]>('/assets', {
          yardUuid: this.yard(),
          search: s,
          lifecycle: l,
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => this.rows.set(r),
    );
  }

  onSearch(term: string) {
    this.filter({ search: term.trim() || null });
  }

  onRemoveChip(chip: FilterChip) {
    const patch: Record<string, string | null> = {};
    for (const k of chip.keys) {
      patch[k] = null;
    }
    this.filter(patch);
  }

  onClearAll() {
    this.filter({
      search: null,
      lifecycle: null,
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({ lifecycle: this.lifecycle() });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de equipos RFID',
      subtitle: 'Ciclo de vida del equipo',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.filter({
          lifecycle: draft.lifecycle || null,
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
