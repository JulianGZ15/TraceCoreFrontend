import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { LogisticsPage } from '../../page';
import { Entity, Row, Summary } from '../../models';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { DriverComponent } from '../../editors/driver/driver.component';
@Component({
  selector: 'tc-logistics-drivers',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
    LookupComponent,
  ],
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.scss',
})
export class DriversComponent extends LogisticsPage {
  override title = 'Choferes';
  override mode = 'master';
  override collection = '';
  override columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'license', label: 'Licencia' },
    { key: 'licenseExpiresAt', label: 'Vence' },
    { key: 'active', label: 'Activo' },
  ];
  open(row: Entity) {
    this.selected.set(row);
  }
  async add() {
    void this.edit(DriverComponent);
  }
  protected override async afterLoad() {
    if (this.filters['carrierUuid'])
      this.rows.set(
        await this.api.get<Row[]>(
          '/drivers/directory',
          { carrierUuid: this.filters['carrierUuid'], offset: this.offset, limit: this.limit },
          this.stop,
        ),
      );
  }
}
