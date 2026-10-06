import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-accounts',
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
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
})
export class AccountsComponent extends FinancePage {
  override title = 'Cuentas de crédito';
  override mode = 'directory';
  override collection = 'credit-accounts/directory';
  override resource = '';
  override columns = [
    { key: 'state', label: 'Estado' },
    { key: 'currency', label: 'Divisa' },
    { key: 'creditLimitExact', label: 'Límite' },
    { key: 'validFrom', label: 'Desde' },
    { key: 'validTo', label: 'Hasta' },
  ];
}
