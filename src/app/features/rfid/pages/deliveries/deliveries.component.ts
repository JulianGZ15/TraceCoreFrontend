import { Component, signal, computed, TemplateRef } from '@angular/core';
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
} from '../../../../shared/ui/page';
import { RfidPage } from '../../page-base';
import { RfidNavComponent } from '../../shared/rfid-nav/rfid-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import * as M from '../../models';

@Component({
  selector: 'tc-rfid-deliveries',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    RfidNavComponent,
    PendingRequestsComponent,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './deliveries.component.html',
  styleUrl: './deliveries.component.scss',
})
export class DeliveriesComponent extends RfidPage {
  readonly rows = signal<M.RemoteRow[]>([]);
  readonly available = signal(true);
  readonly state = signal('');

  readonly drawerForm = new FormGroup({
    state: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'state', label: 'Estado', format: (v) => this.label(v) },
  ];

  readonly currentValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentValues()));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.currentValues()));

  ngOnInit() {
    this.watch(() => this.load());
  }

  async load() {
    const q = this.route.snapshot.queryParamMap;
    const st = q.get('state') ?? '';
    this.state.set(st);

    const cur: Record<string, string> = {};
    if (st) cur['state'] = st;
    this.currentValues.set(cur);

    await this.request(
      () =>
        this.get<M.Remote>('/deliveries', {
          yardUuid: this.yard(),
          state: st || null,
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => {
        this.rows.set(r.rows);
        this.available.set(r.available);
      },
    );
  }

  async requeue(r: M.RemoteRow) {
    if (!(await this.discardDelivery())) return;
    await this.mutate(
      () => this.api.post('/deliveries/' + r.uuid + '/requeue', { version: r.version }),
      () => this.load(),
    );
  }

  async discardDelivery() {
    return (await import('../../../../shared/ui/editor')).confirm(
      this.dialog,
      'Reencolar entrega',
      'Solo reencolamos esta entrega FAILED. El worker conserva su payload e identidad.',
    );
  }

  onRemoveChip(chip: FilterChip) {
    const patch: Record<string, string | null> = {};
    for (const k of chip.keys) {
      patch[k] = null;
    }
    this.filter(patch);
  }

  onClearAll() {
    this.filter({ state: null });
  }

  async openFilters(template: TemplateRef<unknown>) {
    this.drawerForm.reset({ state: this.state() });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de entregas RFID',
      subtitle: 'Estado de entrega del servicio',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.filter({ state: draft.state || null });
      },
      onClear: () => {
        this.drawerForm.reset({ state: '' });
      },
    });
  }

  setDraftState(val: string) {
    this.drawerForm.controls.state.setValue(val);
  }
}
