import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-party-payments',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './party-payments.component.html',
  styleUrl: './party-payments.component.scss',
})
export class PartyPaymentsComponent extends FinancePage {
  override title = 'Pagos del tercero';
  override mode = 'party';
  override collection = 'payments/directory';
  override resource = '';
  override columns = [
    { key: 'direction', label: 'Dirección' },
    { key: 'currency', label: 'Divisa' },
    { key: 'amountExact', label: 'Importe' },
    { key: 'unappliedExact', label: 'Sin aplicar' },
    { key: 'method', label: 'Método' },
    { key: 'operationReference', label: 'Referencia' },
    { key: 'reversed', label: 'Revertido' },
  ];
}
