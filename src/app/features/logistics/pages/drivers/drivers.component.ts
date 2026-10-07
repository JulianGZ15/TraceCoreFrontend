import { Component, signal, computed, TemplateRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { LogisticsPage } from '../../page';
import { Entity, Row } from '../../models';
import {
  PageHeading,
  Feedback,
  Pagination,
  ListContainer,
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
import { DriverComponent } from '../../editors/driver/driver.component';

@Component({
  selector: 'tc-logistics-drivers',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    ListContainer,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
    LookupComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.scss',
})
export class DriversComponent extends LogisticsPage {
  override title = 'Choferes';
  override mode = 'master';
  override collection = '';
  override columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'license', label: 'Licencia' },
    { key: 'licenseExpiresAt', label: 'Vence' },
    { key: 'active', label: 'Activo' },
  ];

  private readonly resolver = inject(EntityLabelResolver);

  readonly drawerForm = new FormGroup({
    carrierUuid: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'carrierUuid', label: 'Transportista' },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly resolvedLabels = new Map<string, string>();
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues(), this.resolvedLabels));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  open(row: Entity) {
    this.selected.set(row);
  }

  async add() {
    void this.edit(DriverComponent);
  }

  protected override async afterLoad() {
    const cur: Record<string, string> = { ...this.filters };
    this.currentValues.set(cur);

    if (this.filters['carrierUuid']) {
      if (!this.resolvedLabels.has(this.filters['carrierUuid'])) {
        const name = await this.resolver.resolve('party', this.filters['carrierUuid']);
        if (name) {
          this.resolvedLabels.set(this.filters['carrierUuid'], name);
          this.currentValues.set({ ...cur });
        }
      }

      this.rows.set(
        await this.api.get<Row[]>(
          '/drivers/directory',
          { carrierUuid: this.filters['carrierUuid'], offset: this.offset, limit: this.limit },
          this.stop,
        ),
      );
    }
  }

  onCarrierChanged(uuid: string) {
    this.update('carrierUuid', uuid);
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
        carrierUuid: null,
        offset: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({
      carrierUuid: this.filters['carrierUuid'] ?? '',
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de choferes',
      subtitle: 'Empresa transportista asignada',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            carrierUuid: draft.carrierUuid || null,
            offset: 0,
          },
          queryParamsHandling: 'merge',
        });
      },
      onClear: () => {
        this.drawerForm.reset({ carrierUuid: '' });
      },
    });
  }

  onDrawerCarrierPicked(uuid: string) {
    this.drawerForm.controls.carrierUuid.setValue(uuid);
  }
}
