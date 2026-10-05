import { LookupComponent } from '../../shared/lookup/lookup.component';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
@Component({
  selector: 'tc-commerce-receipts',
  imports: [
    LookupComponent,
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
export class ReceiptsComponent extends CommercePage {
  override title = 'Recepciones administrativas';
  override mode = 'directory';
  override collection = 'receipts';
  override columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'receivedAt', label: 'Recepción física' },
  ];
}
