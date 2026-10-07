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
  DateRangeComponent,
} from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';

@Component({
  selector: 'tc-finance-payments',
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
    DateRangeComponent,
  ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent extends FinancePage {
  override title = 'Pagos y anticipos';
  override mode = 'directory';
  override collection = 'payments/directory';
  override resource = '';
  override columns = [
    { key: 'direction', label: 'Dirección' },
    { key: 'currency', label: 'Divisa' },
    { key: 'amountExact', label: 'Importe' },
    { key: 'unappliedExact', label: 'Sin aplicar' },
    { key: 'method', label: 'Método' },
    { key: 'operationReference', label: 'Referencia' },
    { key: 'reversed', label: 'Revertido' },
  ];

  private readonly resolver = inject(EntityLabelResolver);

  readonly drawerForm = new FormGroup({
    partyUuid: new FormControl('', { nonNullable: true }),
    currency: new FormControl('', { nonNullable: true }),
    direction: new FormControl('', { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'partyUuid', label: 'Tercero', group: 'Contraparte' },
    { key: 'currency', label: 'Divisa', group: 'Contraparte' },
    { key: 'direction', label: 'Dirección', group: 'Contraparte', format: (v) => this.label(v) },
    { key: 'period', range: { from: 'from', to: 'to' }, label: 'Periodo de operación', group: 'Fecha' },
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
        partyUuid: null,
        currency: null,
        direction: null,
        from: null,
        to: null,
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
      from: this.filters['from'] ?? '',
      to: this.filters['to'] ?? '',
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de pagos y anticipos',
      subtitle: 'Contraparte, divisa, dirección y rango de fechas',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            partyUuid: draft.partyUuid || null,
            currency: draft.currency || null,
            direction: draft.direction || null,
            from: draft.from || null,
            to: draft.to || null,
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
          from: '',
          to: '',
        });
      },
    });
  }

  setDraftDirection(val: string) {
    this.drawerForm.controls.direction.setValue(val);
  }

  onPartyPicked(uuid: string) {
    this.drawerForm.controls.partyUuid.setValue(uuid);
  }
}
