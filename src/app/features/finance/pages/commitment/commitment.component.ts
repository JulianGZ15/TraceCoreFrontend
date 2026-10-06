import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-commitment',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './commitment.component.html',
  styleUrl: './commitment.component.scss',
})
export class CommitmentComponent extends FinancePage {
  override title = 'Compromiso e historial';
  override mode = 'detail';
  override collection = 'history';
  override resource = 'credit-reservations';
  override columns = [
    { key: 'approvedAmountExact', label: 'Aprobado' },
    { key: 'released', label: 'Liquidado' },
    { key: 'reason', label: 'Motivo' },
    { key: 'approvedAt', label: 'Fecha' },
  ];
}
