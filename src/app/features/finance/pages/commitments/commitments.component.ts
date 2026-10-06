import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-commitments',
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
  templateUrl: './commitments.component.html',
  styleUrl: './commitments.component.scss',
})
export class CommitmentsComponent extends FinancePage {
  override title = 'Compromisos por orden';
  override mode = 'directory';
  override collection = 'credit-reservations/directory';
  override resource = '';
  override columns = [
    { key: 'currency', label: 'Divisa' },
    { key: 'approvedAmountExact', label: 'Compromiso aprobado' },
    { key: 'released', label: 'Liquidado' },
    { key: 'orderUuid', label: 'Orden' },
    { key: 'reason', label: 'Motivo' },
  ];
}
