import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
@Component({
  selector: 'tc-commerce-rental-returns',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './rental-returns.component.html',
  styleUrl: './rental-returns.component.scss',
})
export class RentalReturnsComponent extends CommercePage {
  override title = 'Devoluciones administrativas';
  override mode = 'rental';
  override collection = 'returns';
  override columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'receivedAt', label: 'Retorno físico' },
  ];
}
