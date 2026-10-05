import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { LocationEditorComponent } from '../../editors/location-editor/location-editor.component';

@Component({
  selector: 'tc-inventory-yards',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    YardPickerComponent,
    InventoryNavComponent,
  ],
  templateUrl: './yards.component.html',
  styleUrl: './yards.component.scss',
})
export class YardsComponent extends InventoryPage {
  readonly overview = signal<M.Overview>({ path: [], items: [] });
  readonly rows = () => this.overview().items;
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    this.overview.set({ path: [], items: [] });
    if (!this.yard()) {
      const y = this.session
        .context()
        ?.yards.find((y) => this.access.can('INVENTORY_READ', y.uuid));
      if (y) {
        this.changeYard(y.uuid);
        return;
      }
      this.error.set('No hay patios visibles.');
      return;
    }
    await this.request(
      () =>
        this.api.get<M.Overview>(
          '/locations/overview',
          this.params({ parentUuid: this.route.snapshot.queryParamMap.get('parentUuid') }),
        ),
      (v) => this.overview.set(v),
    );
  }
  async create() {
    const parentUuid = this.route.snapshot.queryParamMap.get('parentUuid');
    if (
      await this.editor(
        LocationEditorComponent,
        { yardUuid: this.yard(), parentUuid },
        'Alta de ubicación',
      )
    )
      await this.load();
  }
}
