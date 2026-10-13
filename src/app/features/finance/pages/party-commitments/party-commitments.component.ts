import { Component } from '@angular/core';
import { FinancePage } from '../../page';
import { EntityReferenceComponent, PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-party-commitments',
  imports: [
    EntityReferenceComponent,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './party-commitments.component.html',
  styleUrl: './party-commitments.component.scss',
})
export class PartyCommitmentsComponent extends FinancePage {
  override title = 'Compromisos del tercero';
  override mode = 'party';
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
