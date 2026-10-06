import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-reversals',
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
  templateUrl: './reversals.component.html',
  styleUrl: './reversals.component.scss',
})
export class ReversalsComponent extends FinancePage {
  override title = 'Historial de reversos';
  override mode = 'directory';
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
