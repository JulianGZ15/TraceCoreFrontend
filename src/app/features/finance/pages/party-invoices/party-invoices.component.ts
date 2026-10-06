import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-party-invoices',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './party-invoices.component.html',
  styleUrl: './party-invoices.component.scss',
})
export class PartyInvoicesComponent extends FinancePage {
  override title = 'Facturas del tercero';
  override mode = 'party';
  override collection = 'invoices/directory';
  override resource = '';
  override columns = [
    { key: 'direction', label: 'Dirección' },
    { key: 'state', label: 'Estado' },
    { key: 'currency', label: 'Divisa' },
    { key: 'totalAmountExact', label: 'Total' },
    { key: 'balanceExact', label: 'Saldo' },
    { key: 'dueAt', label: 'Vencimiento' },
    { key: 'reversed', label: 'Revertida' },
  ];
}
