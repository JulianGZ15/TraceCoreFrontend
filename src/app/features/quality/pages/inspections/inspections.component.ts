import { Component, signal, computed, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
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
  DateRangeComponent,
} from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import { QualityNavComponent } from '../../shared/quality-nav/quality-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import * as M from '../../models';

@Component({
  selector: 'tc-quality-inspections',
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    QualityNavComponent,
    PendingRequestsComponent,
    SearchToolbar,
    FilterSection,
    DateRangeComponent,
  ],
  templateUrl: './inspections.component.html',
  styleUrl: './inspections.component.scss',
})
export class InspectionsComponent extends QualityPage {
  readonly rows = signal<M.Row<M.Inspection>[]>([]);
  assetUuid = '';
  state = '';
  responsible = '';
  from = '';
  to = '';
  kind = '';

  readonly drawerForm = new FormGroup({
    assetUuid: new FormControl('', { nonNullable: true }),
    state: new FormControl('', { nonNullable: true }),
    responsibleUuid: new FormControl('', { nonNullable: true }),
    scheduledFrom: new FormControl('', { nonNullable: true }),
    scheduledTo: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'assetUuid', label: 'Pieza' },
    { key: 'state', label: 'Estado', format: (v) => this.label(v) },
    { key: 'responsibleUuid', label: 'Responsable' },
    { key: 'schedule', range: { from: 'scheduledFrom', to: 'scheduledTo' }, label: 'Programación' },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues()));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  ngOnInit() {
    this.watch(() => {
      const q = this.route.snapshot.queryParamMap;
      this.assetUuid = q.get('assetUuid') ?? '';
      this.state = q.get('state') ?? '';
      this.responsible = q.get('responsibleUuid') ?? '';
      this.from = q.get('scheduledFrom') ?? '';
      this.to = q.get('scheduledTo') ?? '';
      this.kind = q.get('kind') ?? '';

      const cur: Record<string, string> = {};
      if (this.assetUuid) cur['assetUuid'] = this.assetUuid;
      if (this.state) cur['state'] = this.state;
      if (this.responsible) cur['responsibleUuid'] = this.responsible;
      if (this.from) cur['scheduledFrom'] = this.from;
      if (this.to) cur['scheduledTo'] = this.to;
      this.currentValues.set(cur);

      return this.load();
    });
  }

  async load() {
    await this.request(
      () =>
        this.get<M.Row<M.Inspection>[]>('/inspections', {
          yardUuid: this.yard() || null,
          assetUuid: this.assetUuid || null,
          state: this.state || null,
          responsibleUuid: this.responsible || null,
          scheduledFrom: this.from || null,
          scheduledTo: this.to || null,
          kind: this.kind || null,
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => this.rows.set(r),
    );
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
      assetUuid: null,
      state: null,
      responsibleUuid: null,
      scheduledFrom: null,
      scheduledTo: null,
      offset: '0',
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({
      assetUuid: this.assetUuid,
      state: this.state,
      responsibleUuid: this.responsible,
      scheduledFrom: this.from,
      scheduledTo: this.to,
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de inspecciones',
      subtitle: 'Pieza, estado, responsable y rango de programación',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.filter({
          assetUuid: draft.assetUuid || null,
          state: draft.state || null,
          responsibleUuid: draft.responsibleUuid || null,
          scheduledFrom: draft.scheduledFrom || null,
          scheduledTo: draft.scheduledTo || null,
          offset: '0',
        });
      },
      onClear: () => {
        this.drawerForm.reset({
          assetUuid: '',
          state: '',
          responsibleUuid: '',
          scheduledFrom: '',
          scheduledTo: '',
        });
      },
    });
  }

  setDraftState(val: string) {
    this.drawerForm.controls.state.setValue(val);
  }
}
