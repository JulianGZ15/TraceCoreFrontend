import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-account',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent extends FinancePage {
  override title = 'Cuenta e historial de límites';
  override mode = 'detail';
  override collection = 'limit-changes';
  override resource = 'credit-accounts';
  override columns = [
    { key: 'previousLimitExact', label: 'Límite anterior' },
    { key: 'newLimitExact', label: 'Nuevo límite' },
    { key: 'reason', label: 'Motivo' },
    { key: 'approvedAt', label: 'Fecha' },
  ];
}
