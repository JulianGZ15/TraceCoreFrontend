import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryPage } from '../../page-base';
import * as M from '../../models';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { LookupComponent } from '../../components/lookup/lookup.component';
import { createIdentifierCodes } from '../../identifier-codes';

@Component({
  selector: 'tc-inventory-identifiers',
  imports: [PageHeading, Feedback, YardPickerComponent, InventoryNavComponent, LookupComponent, RouterLink],
  templateUrl: './identifiers.component.html',
  styleUrl: './identifiers.component.scss',
})
export class IdentifiersComponent extends InventoryPage {
  readonly rows = signal<M.AssetRow[]>([]);
  readonly selected = signal(new Set<string>());
  readonly labels = signal<M.IdentifierLabel[]>([]);
  search = '';
  locationUuid = '';

  constructor() {
    super();
  }

  private readonly location = inject(Location);

  ngOnInit() {
    this.watch(async () => {
      this.search = this.route.snapshot.queryParamMap.get('search') ?? '';
      this.locationUuid = this.route.snapshot.queryParamMap.get('locationUuid') ?? '';
      const preselected = this.route.snapshot.queryParamMap.get('assetUuid');
      if (preselected) this.selected.set(new Set([...this.selected(), preselected]));
      await this.load();
    });
  }

  async load() {
    this.labels.set([]);
    await this.request(
      () => this.api.get<M.AssetRow[]>('/assets', this.params({ search: this.search || null, locationUuid: this.locationUuid || null, limit: 100, offset: 0 })),
      (rows) => this.rows.set(rows),
    );
  }

  setLocation(uuid: string) {
    this.locationUuid = uuid;
    this.selected.set(new Set());
    void this.load();
  }

  toggle(row: M.AssetRow, checked: boolean) {
    const selected = new Set(this.selected());
    if (checked && selected.size < 100) selected.add(row.uuid);
    else if (!checked) selected.delete(row.uuid);
    this.selected.set(selected);
  }

  async generate() {
    const ids = [...this.selected()].slice(0, 100);
    if (!ids.length) {
      this.error.set('Selecciona al menos un activo.');
      return;
    }
    await this.request(
      () => this.api.post<M.IdentifierAsset[]>('/assets/identifiers', { assetUuids: ids }),
      (rows) => {
        const labels = rows.map((asset) => {
          const tree = this.router.createUrlTree(['/equipos', asset.uuid, 'general']);
          const target = new URL(this.location.prepareExternalUrl(this.router.serializeUrl(tree)), document.baseURI).href;
          return { asset, url: target, ...createIdentifierCodes(asset.uuid, target) };
        });
        this.labels.set(labels);
      },
    );
  }

  clearSelection() {
    this.selected.set(new Set());
    this.labels.set([]);
  }

  print() {
    if (this.labels().length) window.print();
  }
}
