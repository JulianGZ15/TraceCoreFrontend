import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-invoice-charges',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './invoice-charges.component.html',
  styleUrl: './invoice-charges.component.scss',
})
export class InvoiceChargesComponent extends FinancePage {
  override title = 'Fuentes de la factura';
  override mode = 'invoice';
  override collection = 'charges';
  override resource = '';
  override columns = [
    { key: 'chargeUuid', label: 'Cargo' },
    { key: 'invoiceLineUuid', label: 'Partida' },
    { key: 'netAmountExact', label: 'Neto' },
    { key: 'taxAmountExact', label: 'Impuesto' },
  ];
}
