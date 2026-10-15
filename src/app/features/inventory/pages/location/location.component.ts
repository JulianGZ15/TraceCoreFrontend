import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { DataTable } from '../../../../shared/ui/data-table/data-table.component';
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { LocationEditorComponent } from '../../editors/location-editor/location-editor.component';

@Component({
  selector: 'tc-inventory-location',
  imports: [RouterLink, PageHeading, Feedback, Pagination, DataTable, InventoryNavComponent],
  templateUrl: './location.component.html',
  styleUrl: './location.component.scss',
})
export class LocationComponent extends InventoryPage {
  readonly row = signal<M.Location | null>(null);
  readonly occupancy = signal<M.Occupancy | null>(null);
  readonly assets = signal<M.AssetRow[]>([]);
  readonly movements = signal<M.LocationMovement[]>([]);
  readonly selectedRoots = signal<string[]>([]);
  protected override resourceChanged() {
    this.row.set(null);
    this.occupancy.set(null);
    this.assets.set([]);
    this.movements.set([]);
    this.selectedRoots.set([]);
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      async () => {
        const l = await this.api.get<M.Location>('/locations/' + this.id());
        const [o, assets, movements] = await Promise.all([
          this.api.get<M.Occupancy>('/locations/' + this.id() + '/occupancy'),
          this.api.get<M.AssetRow[]>('/assets', { yardUuid: l.yardUuid, locationUuid: this.id(), offset: this.offset(), limit: this.limit() }),
          this.api.get<M.LocationMovement[]>('/locations/' + this.id() + '/movements', { offset: this.offset(), limit: this.limit() }),
        ]);
        return { l, o, assets, movements };
      },
      (v) => {
        this.row.set(v.l);
        this.occupancy.set(v.o);
        this.assets.set(v.assets);
        this.movements.set(v.movements);
        this.selectedRoots.set([]);
      },
    );
  }
  toggleRoot(assetUuid: string, checked: boolean) {
    this.selectedRoots.update((current) => checked
      ? current.includes(assetUuid) ? current : [...current, assetUuid]
      : current.filter((uuid) => uuid !== assetUuid));
  }
  moveSelected() {
    const l = this.row();
    const assets = this.selectedRoots();
    if (!l || !assets.length || !this.access.can('MOVEMENT_MANAGE', l.yardUuid)) return;
    void this.router.navigate(['/inventario/movimientos/nuevo'], { queryParams: {
      yardUuid: l.yardUuid,
      type: 'TRANSFER',
      destinationYardUuid: l.yardUuid,
      destinationLocationUuid: l.uuid,
      assetUuids: assets.join(','),
      internal: 'true',
    } });
  }
  addUnlocated() {
    const l = this.row();
    if (!l || !this.access.can('MOVEMENT_MANAGE', l.yardUuid)) return;
    void this.router.navigate(['/inventario/movimientos/nuevo'], { queryParams: {
      yardUuid: l.yardUuid,
      type: 'INBOUND',
      destinationYardUuid: l.yardUuid,
      destinationLocationUuid: l.uuid,
      internal: 'true',
    } });
  }
  locationText(location: M.Location | null) {
    return location ? `${location.code} · ${location.name}` : 'Sin ubicación';
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
