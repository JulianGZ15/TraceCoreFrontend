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
@Component({
  selector: 'tc-logistics-receipts',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.scss',
})
export class ReceiptsComponent extends LogisticsPage {
  override title = 'Entregas del manifiesto';
  override mode = 'manifest';
  override collection = 'receipts';
  override columns = [
    { key: 'receiverName', label: 'Receptor' },
    { key: 'receivedAt', label: 'Fecha' },
    { key: 'complete', label: 'Completa' },
  ];
  open(row: Entity) {
    this.selected.set(row);
  }
}
