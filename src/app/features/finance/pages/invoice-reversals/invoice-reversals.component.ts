import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-invoice-reversals',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './invoice-reversals.component.html',
  styleUrl: './invoice-reversals.component.scss',
})
export class InvoiceReversalsComponent extends FinancePage {
  override title = 'Reversos de factura';
  override mode = 'invoice';
  override collection = '';
  override resource = 'reversals';
  override columns = [
    { key: 'invoiceUuid', label: 'Factura' },
    { key: 'paymentUuid', label: 'Pago' },
    { key: 'allocationUuid', label: 'Aplicación' },
    { key: 'creditNoteUuid', label: 'Nota' },
    { key: 'reason', label: 'Motivo' },
    { key: 'approvedAt', label: 'Fecha' },
  ];
}
