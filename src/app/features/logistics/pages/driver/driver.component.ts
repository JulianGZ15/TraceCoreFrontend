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
import { DriverComponent as DriverComponentEditor } from '../../editors/driver/driver.component';
@Component({
  selector: 'tc-logistics-driver',
  imports: [
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
    DriverComponentEditor,
  ],
  templateUrl: './driver.component.html',
  styleUrl: './driver.component.scss',
})
export class DriverComponent extends LogisticsPage {
  override title = 'Ficha de chofer';
  override mode = 'detail';
  override collection = '';
  override columns = [];
  open(row: Entity) {
    this.selected.set(row);
  }
  protected override async afterLoad() {
    this.selected.set(await this.api.get<Entity>('/drivers/' + this.id, {}, this.stop));
  }
}
