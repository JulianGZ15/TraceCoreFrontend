import { Component, signal, computed, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { LogisticsPage } from '../../page';
import { Entity, Row } from '../../models';
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
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';

@Component({
  selector: 'tc-logistics-manifests',
  imports: [
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
  templateUrl: './manifests.component.html',
  styleUrl: './manifests.component.scss',
})
export class ManifestsComponent extends LogisticsPage {
  override title = 'Manifiestos';
  override mode = 'directory';
  override collection = 'manifests/directory';
  override columns = [
    { key: 'type', label: 'Tipo' },
    { key: 'state', label: 'Estado' },
    { key: 'createdAt', label: 'Creado' },
  ];

  readonly drawerForm = new FormGroup({
    state: new FormControl('', { nonNullable: true }),
    type: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'state', label: 'Estado', format: (v) => this.label(v) },
    { key: 'type', label: 'Tipo', format: (v) => this.label(v) },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues()));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  override async reload() {
    await super.reload();
    this.currentValues.set({ ...this.filters });
  }

  open(row: Entity) {
    void this.router.navigate(['/logistica/manifiestos', row.uuid]);
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
        state: null,
        type: null,
        offset: 0,
      },
      queryParamsHandling: 'merge',
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({
      state: this.filters['state'] ?? '',
      type: this.filters['type'] ?? '',
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de manifiestos',
      subtitle: 'Estado operativo y tipo de traslado',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            state: draft.state || null,
            type: draft.type || null,
            offset: 0,
          },
          queryParamsHandling: 'merge',
        });
      },
      onClear: () => {
        this.drawerForm.reset({ state: '', type: '' });
      },
    });
  }

  setDraftState(val: string) {
    this.drawerForm.controls.state.setValue(val);
  }

  setDraftType(val: string) {
    this.drawerForm.controls.type.setValue(val);
  }
}
