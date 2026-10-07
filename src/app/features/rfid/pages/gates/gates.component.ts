import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeading, Feedback, Pagination, SearchToolbar } from '../../../../shared/ui/page';
import { RfidPage } from '../../page-base';
import { RfidNavComponent } from '../../shared/rfid-nav/rfid-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import * as M from '../../models';
import { GateComponent } from '../../editors/gate/gate.component';

@Component({
  selector: 'tc-rfid-gates',
  imports: [
    RouterLink,
    FormsModule,
    PageHeading,
    Feedback,
    Pagination,
    RfidNavComponent,
    PendingRequestsComponent,
    SearchToolbar,
  ],
  templateUrl: './gates.component.html',
  styleUrl: './gates.component.scss',
})
export class GatesComponent extends RfidPage {
  readonly rows = signal<M.Local<M.Gate>[]>([]);

  ngOnInit() {
    this.watch(() => this.load());
  }

  async load() {
    await this.request(
      () =>
        this.get<M.Local<M.Gate>[]>('/gates', {
          yardUuid: this.yard(),
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => this.rows.set(r),
    );
  }

  async create() {
    if (await this.editor(GateComponent, { yardUuid: this.yard() }, 'Nuevo registro'))
      await this.load();
  }
}
