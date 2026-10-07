import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeading, ListContainer, Feedback, Pagination } from '../../../../shared/ui/page';
import { RfidPage } from '../../page-base';
import { RfidNavComponent } from '../../shared/rfid-nav/rfid-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import * as M from '../../models';
import { DeviceComponent } from '../../editors/device/device.component';

@Component({
  selector: 'tc-rfid-devices',
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
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.scss',
})
export class DevicesComponent extends RfidPage {
  readonly rows = signal<M.RemoteRow[]>([]);
  readonly available = signal(true);

  ngOnInit() {
    this.watch(() => this.load());
  }

  async load() {
    await this.request(
      () =>
        this.get<M.Remote>('/devices', {
          yardUuid: this.yard(),
          state: this.route.snapshot.queryParamMap.get('state'),
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => {
        this.rows.set(r.rows);
        this.available.set(r.available);
      },
    );
  }

  async create() {
    if (await this.editor(DeviceComponent, {}, 'Nuevo registro')) {
      await this.load();
    }
  }
}
