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
import { VehicleComponent } from '../../editors/vehicle/vehicle.component';
@Component({
  selector: 'tc-logistics-vehicles',
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
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent extends LogisticsPage {
  override title = 'Vehículos y remolques';
  override mode = 'master';
  override collection = '';
  override columns = [
    { key: 'plate', label: 'Placa' },
    { key: 'type', label: 'Tipo' },
    { key: 'maxWeightKgExact', label: 'Capacidad kg' },
    { key: 'maxPositions', label: 'Posiciones' },
    { key: 'active', label: 'Activo' },
  ];
  open(row: Entity) {
    this.selected.set(row);
  }
  async add() {
    void this.edit(VehicleComponent);
  }
  protected override async afterLoad() {
    if (this.filters['carrierUuid'])
      this.rows.set(
        await this.api.get<Row[]>(
          '/vehicles/directory',
          { carrierUuid: this.filters['carrierUuid'], offset: this.offset, limit: this.limit },
          this.stop,
        ),
      );
  }
}
