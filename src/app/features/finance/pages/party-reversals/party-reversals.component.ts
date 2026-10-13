import { Component } from '@angular/core';
import { FinancePage } from '../../page';
import { EntityReferenceComponent, PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-party-reversals',
  imports: [
    EntityReferenceComponent,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './party-reversals.component.html',
  styleUrl: './party-reversals.component.scss',
})
export class PartyReversalsComponent extends FinancePage {
  override title = 'Reversos del tercero';
  override mode = 'party';
  override collection = 'reversals/directory';
  override resource = '';
  override columns = [
    { key: 'invoiceUuid', label: 'Factura' },
    { key: 'paymentUuid', label: 'Pago' },
    { key: 'allocationUuid', label: 'Aplicación' },
    { key: 'creditNoteUuid', label: 'Nota' },
    { key: 'reason', label: 'Motivo' },
    { key: 'approvedAt', label: 'Fecha' },
  ];
}
