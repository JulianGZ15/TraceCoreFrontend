import { Component, signal, computed, TemplateRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommercePage } from '../../page';
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
  EntityLabelResolver,
} from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';

@Component({
  selector: 'tc-commerce-orders',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    ListContainer,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
    SearchToolbar,
    FilterSection,
    LookupComponent,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent extends CommercePage {
  override title = 'Órdenes comerciales';
  override mode = 'directory';
  override collection = 'orders/directory';
  override columns = [
    { key: 'type', label: 'Tipo' },
    { key: 'state', label: 'Estado' },
    { key: 'currency', label: 'Divisa' },
  ];

  private readonly resolver = inject(EntityLabelResolver);

  readonly drawerForm = new FormGroup({
    type: new FormControl('', { nonNullable: true }),
    state: new FormControl('', { nonNullable: true }),
    partyUuid: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'type', label: 'Tipo', format: (v) => this.label(v) },
    { key: 'state', label: 'Estado', format: (v) => this.label(v) },
    { key: 'partyUuid', label: 'Contraparte' },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly resolvedLabels = new Map<string, string>();
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues(), this.resolvedLabels));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  override async reload() {
    await super.reload();
    const cur: Record<string, string> = { ...this.filters };
    this.currentValues.set(cur);

    if (this.filters['partyUuid'] && !this.resolvedLabels.has(this.filters['partyUuid'])) {
      const name = await this.resolver.resolve('party', this.filters['partyUuid']);
      if (name) {
        this.resolvedLabels.set(this.filters['partyUuid'], name);
        this.currentValues.set({ ...cur });
      }
    }
  }

  onSearch(term: string) {
    this.update('search', term);
  }

  onRemoveChip(chip: FilterChip) {
    const queryParams: Record<string, string | number | null> = { offset: 0 };
    for (const k of chip.keys) {
      queryParams[k] = null;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  onClearAll() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: null,
        type: null,
        state: null,
        partyUuid: null,
        offset: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({
      type: this.filters['type'] ?? '',
      state: this.filters['state'] ?? '',
      partyUuid: this.filters['partyUuid'] ?? '',
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de órdenes comerciales',
      subtitle: 'Tipo de orden, estado operativo y contraparte',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            type: draft.type || null,
            state: draft.state || null,
            partyUuid: draft.partyUuid || null,
            offset: 0,
          },
          queryParamsHandling: 'merge',
        });
      },
      onClear: () => {
        this.drawerForm.reset({ type: '', state: '', partyUuid: '' });
      },
    });
  }

  setDraftType(val: string) {
    this.drawerForm.controls.type.setValue(val);
  }

  setDraftState(val: string) {
    this.drawerForm.controls.state.setValue(val);
  }

  onPartyPicked(uuid: string) {
    this.drawerForm.controls.partyUuid.setValue(uuid);
  }
}
