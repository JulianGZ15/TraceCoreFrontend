import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { Api, Yard } from '../../../core/http/api';
import { Session } from '../../../core/auth/session';
import { PageHeading, Feedback, Status, Pagination } from '../../../shared/ui/page';
import { PageList } from '../../../shared/ui/list-model';
import { edit } from '../../../shared/ui/editor';
import { yardFields } from '../detail';
@Component({
  selector: 'tc-yards',
  imports: [RouterLink, PageHeading, Feedback, Status, Pagination],
  templateUrl: './yards.component.html',
  styleUrl: './yards.component.scss',
})
export class YardsPage {
  private api = inject(Api);
  private dialog = inject(Dialog);
  private session = inject(Session);
  readonly list = new PageList<Yard>(this.api, '/yards');
  constructor() {
    void this.list.load();
  }
  async create() {
    const result = await edit(this.dialog, {
      title: 'Nuevo patio',
      fields: yardFields,
      save: (values) => this.api.post<Yard>('/yards', values),
    });
    if (result) {
      this.list.success.set('Patio creado.');
      await this.list.load();
      await this.session.refresh();
    }
  }
}
