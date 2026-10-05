import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryForm } from '../../page-base';

import { confirm } from '../../../../shared/ui/editor';
import * as M from '../../models';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-reservation',
  imports: [RouterLink, ReactiveFormsModule, PageHeading, Feedback, Pagination, InventoryNavComponent],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.scss',
})
export class ReservationComponent extends InventoryForm {
  readonly detail = signal<M.ReservationDetail | null>(null);
  readonly rows = signal<M.Reservation[]>([]);
  readonly form = new FormGroup({ reason: new FormControl('', { nonNullable: true }) });
  protected override resourceChanged() {
    super.resourceChanged();
    this.detail.set(null);
    this.rows.set([]);
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      async () => ({
        detail: await this.api.get<M.ReservationDetail>('/reservations/' + this.id()),
        rows: await this.api.get<M.Reservation[]>('/reservations/' + this.id() + '/members', {
          offset: this.offset(),
          limit: this.limit(),
        }),
      }),
      (v) => {
        this.detail.set(v.detail);
        this.rows.set(v.rows);
      },
    );
  }
  async run(action: string) {
    const r = this.detail()!.reservation;
    if (action === 'cancel' && !this.form.controls.reason.value.trim()) {
      this.error.set('Indica un motivo.');
      return;
    }
    await this.action(
      '/reservations/' + r.uuid + '/' + action,
      {
        version: r.version,
        ...(action === 'cancel' ? { reason: this.form.controls.reason.value } : {}),
      },
      () => this.load(),
      action === 'confirm' ? 'Confirmar grupo' : 'Cancelar grupo',
    );
    if (!this.error()) this.form.markAsPristine();
  }
  async reload() {
    if (await confirm(this.dialog, 'Recargar reserva', 'Se descartará el motivo sin guardar.')) {
      this.form.reset();
      await this.load();
    }
  }
}
