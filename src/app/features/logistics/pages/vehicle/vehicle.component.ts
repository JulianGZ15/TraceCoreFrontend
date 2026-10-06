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
import { VehicleComponent as VehicleComponentEditor } from '../../editors/vehicle/vehicle.component';
@Component({
  selector: 'tc-logistics-vehicle',
  imports: [
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
    VehicleComponentEditor,
  ],
  templateUrl: './vehicle.component.html',
  styleUrl: './vehicle.component.scss',
})
export class VehicleComponent extends LogisticsPage {
  override title = 'Ficha de vehículo';
  override mode = 'detail';
  override collection = '';
  override columns = [];
  open(row: Entity) {
    this.selected.set(row);
  }
  protected override async afterLoad() {
    this.selected.set(await this.api.get<Entity>('/vehicles/' + this.id, {}, this.stop));
  }
}
