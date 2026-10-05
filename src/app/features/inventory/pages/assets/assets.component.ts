import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-assets',
  imports: [
    RouterLink,
    FormsModule,
    PageHeading,
    Feedback,
    Pagination,
    YardPickerComponent,
    InventoryNavComponent,
  ],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
})
export class AssetsComponent extends InventoryPage {
  readonly rows = signal<M.AssetRow[]>([]);
  search = '';
  placement = '';
  rootsOnly = false;
  ngOnInit() {
    this.watch(() => {
      const q = this.route.snapshot.queryParamMap;
      this.search = q.get('search') ?? '';
      this.placement = q.get('placementState') ?? '';
      this.rootsOnly = q.get('rootsOnly') === 'true';
      return this.load();
    });
  }
  async load() {
    await this.request(
      () =>
        this.api.get<M.AssetRow[]>(
          '/assets',
          this.params({
            search: this.search.trim() || null,
            placementState: this.placement || null,
            rootsOnly: this.rootsOnly,
            locationUuid: this.route.snapshot.queryParamMap.get('locationUuid'),
          }),
        ),
      (r) => this.rows.set(r),
    );
  }
  filter() {
    this.query({
      search: this.search.trim() || null,
      placementState: this.placement || null,
      rootsOnly: String(this.rootsOnly),
      offset: 0,
    });
  }
}
