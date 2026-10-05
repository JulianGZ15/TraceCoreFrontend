import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-movements',
  imports: [
    RouterLink,
    FormsModule,
    PageHeading,
    Feedback,
    Pagination,
    YardPickerComponent,
    InventoryNavComponent,
  ],
  templateUrl: './movements.component.html',
  styleUrl: './movements.component.scss',
})
export class MovementsComponent extends InventoryPage {
  readonly rows = signal<M.Movement[]>([]);
  state = '';
  ngOnInit() {
    this.watch(() => {
      this.state = this.route.snapshot.queryParamMap.get('state') ?? '';
      return this.load();
    });
  }
  async load() {
    await this.request(
      () => this.api.get<M.Movement[]>('/movements', this.params({ state: this.state || null })),
      (r) => this.rows.set(r),
    );
  }
}
