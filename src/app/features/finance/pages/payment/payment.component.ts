import { ReversalComponent } from '../../editors/reversal/reversal.component';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-payment',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent extends FinancePage {
  override title = 'Pago y aplicaciones';
  override mode = 'payment';
  override collection = '';
  override resource = '';
  override columns = [
    { key: 'invoiceUuid', label: 'Factura' },
    { key: 'amountExact', label: 'Aplicado' },
    { key: 'reversed', label: 'Revertida' },
  ];
  editReversal(row: import('../../models').Entity) {
    void this.edit(ReversalComponent, { row, resource: 'applications' });
  }
}
