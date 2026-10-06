import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-invoices',
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
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss',
})
export class InvoicesComponent extends FinancePage {
  override title = 'Facturas administrativas';
  override mode = 'directory';
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
