import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeading, ListContainer, Feedback, Pagination } from '../../../../shared/ui/page';
import { RfidPage } from '../../page-base';
import { RfidNavComponent } from '../../shared/rfid-nav/rfid-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import * as M from '../../models';
import { TagComponent } from '../../editors/tag/tag.component';

@Component({
  selector: 'tc-rfid-tags',
  imports: [
    RouterLink,
    FormsModule,
    PageHeading,
    ListContainer,
    Feedback,
    Pagination,
    RfidNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss',
})
export class TagsComponent extends RfidPage {
  readonly rows = signal<M.Local<M.Tag>[]>([]);

  ngOnInit() {
    this.watch(() => this.load());
  }

  async load() {
    await this.request(
      () =>
        this.get<M.Local<M.Tag>[]>('/tags', {
          yardUuid: this.yard(),
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => this.rows.set(r),
    );
  }

  async create() {
    if (await this.editor(TagComponent, { yardUuid: this.yard() }, 'Nuevo registro')) {
      await this.load();
    }
  }
}
