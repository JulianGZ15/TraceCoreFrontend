import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { SiteEditorComponent } from '../../editors/site-editor/site-editor.component';

@Component({
  selector: 'tc-inventory-sites',
  imports: [RouterLink, FormsModule, PageHeading, Feedback, Pagination, InventoryNavComponent],
  templateUrl: './sites.component.html',
  styleUrl: './sites.component.scss',
})
export class SitesComponent extends InventoryPage {
  readonly rows = signal<M.Site[]>([]);
  active = '';
  ngOnInit() {
    this.watch(() => {
      this.active = this.route.snapshot.queryParamMap.get('active') ?? '';
      return this.load();
    });
  }
  async load() {
    await this.request(
      () =>
        this.api.get<M.Site[]>('/sites', {
          offset: this.offset(),
          limit: this.limit(),
          active: this.active || null,
        }),
      (r) => this.rows.set(r),
    );
  }
  async create() {
    const r = await this.editor(SiteEditorComponent, {}, 'Alta de sitio');
    if (r) await this.load();
  }
}
