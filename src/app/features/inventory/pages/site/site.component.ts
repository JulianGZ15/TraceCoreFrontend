import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { InventoryPage } from '../../page-base';

import * as M from '../../models';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { SiteEditorComponent } from '../../editors/site-editor/site-editor.component';

@Component({
  selector: 'tc-inventory-site',
  imports: [RouterLink, PageHeading, Feedback, InventoryNavComponent],
  templateUrl: './site.component.html',
  styleUrl: './site.component.scss',
})
export class SiteComponent extends InventoryPage {
  readonly row = signal<M.Site | null>(null);
  protected override resourceChanged() {
    this.row.set(null);
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () => this.api.get<M.Site>('/sites/' + this.id()),
      (r) => this.row.set(r),
    );
  }
  async edit() {
    if (await this.editor(SiteEditorComponent, { row: this.row() }, 'Editar sitio'))
      await this.load();
  }
}
