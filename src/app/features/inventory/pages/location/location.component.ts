import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { LocationEditorComponent } from '../../editors/location-editor/location-editor.component';

@Component({
  selector: 'tc-inventory-location',
  imports: [RouterLink, PageHeading, Feedback, InventoryNavComponent],
  templateUrl: './location.component.html',
  styleUrl: './location.component.scss',
})
export class LocationComponent extends InventoryPage {
  readonly row = signal<M.Location | null>(null);
  readonly occupancy = signal<M.Occupancy | null>(null);
  protected override resourceChanged() {
    this.row.set(null);
    this.occupancy.set(null);
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      async () => {
        const l = await this.api.get<M.Location>('/locations/' + this.id());
        const o = await this.api.get<M.Occupancy>('/locations/' + this.id() + '/occupancy');
        return { l, o };
      },
      (v) => {
        this.row.set(v.l);
        this.occupancy.set(v.o);
      },
    );
  }
  async edit() {
    const row = this.row();
    if (
      row &&
      (await this.editor(
        LocationEditorComponent,
        { row, yardUuid: row.yardUuid, parentUuid: row.parentUuid },
        'Editar ubicación',
      ))
    )
      await this.load();
  }
}
