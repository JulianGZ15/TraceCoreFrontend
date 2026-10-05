import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
@Component({
  selector: 'tc-commerce-order-receipts',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './order-receipts.component.html',
  styleUrl: './order-receipts.component.scss',
})
export class OrderReceiptsComponent extends CommercePage {
  override title = 'Recepciones de compra';
  override mode = 'order';
  override collection = 'receipts';
  override columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'receivedAt', label: 'Instante' },
  ];
}
