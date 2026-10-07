import { Component, signal, computed, TemplateRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommercePage } from '../../page';
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
  EntityLabelResolver,
} from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';

@Component({
  selector: 'tc-commerce-rentals',
  imports: [
    LookupComponent,
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './rentals.component.html',
  styleUrl: './rentals.component.scss',
})
export class RentalsComponent extends CommercePage {
  override title = 'Contratos de renta';
  override mode = 'directory';
  override collection = 'rentals';
  override columns = [
    { key: 'state', label: 'Estado' },
    { key: 'plannedFrom', label: 'Inicio previsto' },
    { key: 'plannedTo', label: 'Fin previsto' },
  ];

  private readonly resolver = inject(EntityLabelResolver);

  readonly drawerForm = new FormGroup({
    state: new FormControl('', { nonNullable: true }),
    partyUuid: new FormControl('', { nonNullable: true }),
    distributorUuid: new FormControl('', { nonNullable: true }),
    endCustomerUuid: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'state', label: 'Estado', format: (v) => this.label(v) },
    { key: 'partyUuid', label: 'Contratante' },
    { key: 'distributorUuid', label: 'Distribuidor' },
    { key: 'endCustomerUuid', label: 'Cliente final' },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly resolvedLabels = new Map<string, string>();
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues(), this.resolvedLabels));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  override async reload() {
    await super.reload();
    const cur: Record<string, string> = { ...this.filters };
    this.currentValues.set(cur);

    for (const key of ['partyUuid', 'distributorUuid', 'endCustomerUuid']) {
      const uuid = this.filters[key];
      if (uuid && !this.resolvedLabels.has(uuid)) {
        const name = await this.resolver.resolve('party', uuid);
        if (name) {
          this.resolvedLabels.set(uuid, name);
          this.currentValues.set({ ...cur });
        }
      }
    }
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
        state: null,
        partyUuid: null,
        distributorUuid: null,
        endCustomerUuid: null,
        offset: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({
      state: this.filters['state'] ?? '',
      partyUuid: this.filters['partyUuid'] ?? '',
      distributorUuid: this.filters['distributorUuid'] ?? '',
      endCustomerUuid: this.filters['endCustomerUuid'] ?? '',
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de rentas',
      subtitle: 'Estado operativo, contratante, distribuidor y cliente final',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            state: draft.state || null,
            partyUuid: draft.partyUuid || null,
            distributorUuid: draft.distributorUuid || null,
            endCustomerUuid: draft.endCustomerUuid || null,
            offset: 0,
          },
          queryParamsHandling: 'merge',
        });
      },
      onClear: () => {
        this.drawerForm.reset({
          state: '',
          partyUuid: '',
          distributorUuid: '',
          endCustomerUuid: '',
        });
      },
    });
  }

  setDraftState(val: string) {
    this.drawerForm.controls.state.setValue(val);
  }

  onPartyPicked(field: 'partyUuid' | 'distributorUuid' | 'endCustomerUuid', uuid: string) {
    this.drawerForm.controls[field].setValue(uuid);
  }
}
