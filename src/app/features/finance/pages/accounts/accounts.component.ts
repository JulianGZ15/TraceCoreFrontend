import { Component, signal, computed, TemplateRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { FinancePage } from '../../page';
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
  selector: 'tc-finance-accounts',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
    LookupComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
})
export class AccountsComponent extends FinancePage {
  override title = 'Cuentas de crédito';
  override mode = 'directory';
  override collection = 'accounts/directory';
  override resource = '';
  override columns = [
    { key: 'direction', label: 'Dirección' },
    { key: 'currency', label: 'Divisa' },
    { key: 'state', label: 'Estado' },
    { key: 'limitExact', label: 'Límite' },
    { key: 'availableExact', label: 'Disponible' },
    { key: 'usedExact', label: 'Utilizado' },
  ];

  private readonly resolver = inject(EntityLabelResolver);

  readonly drawerForm = new FormGroup({
    partyUuid: new FormControl('', { nonNullable: true }),
    currency: new FormControl('', { nonNullable: true }),
    direction: new FormControl('', { nonNullable: true }),
    state: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'partyUuid', label: 'Tercero', group: 'Contraparte' },
    { key: 'currency', label: 'Divisa', group: 'Contraparte' },
    { key: 'direction', label: 'Dirección', group: 'Contraparte', format: (v) => this.label(v) },
    { key: 'state', label: 'Estado', group: 'Estado', format: (v) => this.label(v) },
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
        partyUuid: null,
        currency: null,
        direction: null,
        state: null,
        offset: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({
      partyUuid: this.filters['partyUuid'] ?? '',
      currency: this.filters['currency'] ?? '',
      direction: this.filters['direction'] ?? '',
      state: this.filters['state'] ?? '',
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de cuentas de crédito',
      subtitle: 'Contraparte, divisa, dirección y estado',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            partyUuid: draft.partyUuid || null,
            currency: draft.currency || null,
            direction: draft.direction || null,
            state: draft.state || null,
            offset: 0,
          },
          queryParamsHandling: 'merge',
        });
      },
      onClear: () => {
        this.drawerForm.reset({
          partyUuid: '',
          currency: '',
          direction: '',
          state: '',
        });
      },
    });
  }

  setDraftDirection(val: string) {
    this.drawerForm.controls.direction.setValue(val);
  }

  setDraftState(val: string) {
    this.drawerForm.controls.state.setValue(val);
  }

  onPartyPicked(uuid: string) {
    this.drawerForm.controls.partyUuid.setValue(uuid);
  }
}
