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
  selector: 'tc-commerce-receipts',
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
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.scss',
})
export class ReceiptsComponent extends CommercePage {
  override title = 'Recepciones administrativas';
  override mode = 'directory';
  override collection = 'receipts';
  override columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'receivedAt', label: 'Recepción física' },
  ];

  private readonly resolver = inject(EntityLabelResolver);

  readonly drawerForm = new FormGroup({
    originPartyUuid: new FormControl('', { nonNullable: true }),
    orderUuid: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'originPartyUuid', label: 'Origen' },
    { key: 'orderUuid', label: 'Orden' },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly resolvedLabels = new Map<string, string>();
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues(), this.resolvedLabels));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  override async reload() {
    await super.reload();
    const cur: Record<string, string> = { ...this.filters };
    this.currentValues.set(cur);

    if (this.filters['originPartyUuid'] && !this.resolvedLabels.has(this.filters['originPartyUuid'])) {
      const name = await this.resolver.resolve('party', this.filters['originPartyUuid']);
      if (name) {
        this.resolvedLabels.set(this.filters['originPartyUuid'], name);
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
        originPartyUuid: null,
        orderUuid: null,
        offset: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({
      originPartyUuid: this.filters['originPartyUuid'] ?? '',
      orderUuid: this.filters['orderUuid'] ?? '',
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de recepciones',
      subtitle: 'Tercero de origen y orden asociada',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            originPartyUuid: draft.originPartyUuid || null,
            orderUuid: draft.orderUuid || null,
            offset: 0,
          },
          queryParamsHandling: 'merge',
        });
      },
      onClear: () => {
        this.drawerForm.reset({ originPartyUuid: '', orderUuid: '' });
      },
    });
  }

  onOriginPicked(uuid: string) {
    this.drawerForm.controls.originPartyUuid.setValue(uuid);
  }

  onOrderPicked(uuid: string) {
    this.drawerForm.controls.orderUuid.setValue(uuid);
  }
}
