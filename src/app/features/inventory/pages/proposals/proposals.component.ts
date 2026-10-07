import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeading, ListContainer, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-proposals',
  imports: [
    RouterLink,
    PageHeading,
    ListContainer,
    Feedback,
    Pagination,
    YardPickerComponent,
    InventoryNavComponent,
  ],
  templateUrl: './proposals.component.html',
  styleUrl: './proposals.component.scss',
})
export class ProposalsComponent extends InventoryPage {
  readonly rows = signal<M.Proposal[]>([]);
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () => this.api.get<M.Proposal[]>('/proposals', this.params()),
      (r) => this.rows.set(r),
    );
  }
}
