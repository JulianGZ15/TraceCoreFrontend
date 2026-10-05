import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { ReservationEditorComponent } from '../../editors/reservation-editor/reservation-editor.component';

@Component({
  selector: 'tc-inventory-reservations',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    YardPickerComponent,
    InventoryNavComponent,
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss',
})
export class ReservationsComponent extends InventoryPage {
  readonly rows = signal<M.Reservation[]>([]);
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () =>
        this.api.get<M.Reservation[]>(
          '/reservations',
          this.params({
            rootsOnly: true,
            rootAssetUuid: this.route.snapshot.queryParamMap.get('rootAssetUuid'),
          }),
        ),
      (r) => this.rows.set(r),
    );
  }
  async create() {
    if (!this.yard()) {
      this.error.set('Selecciona un patio para reservar.');
      return;
    }
    const r = await this.editor(
      ReservationEditorComponent,
      { yardUuid: this.yard() },
      'Reservar conjunto',
    );
    if (r) await this.load();
  }
}
