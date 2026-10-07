import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination, ListContainer } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-currencies',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    ListContainer,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './currencies.component.html',
  styleUrl: './currencies.component.scss',
})
export class CurrenciesComponent extends FinancePage {
  override title = 'Divisas y precisión';
  override mode = 'directory';
  override collection = '';
  override resource = 'currencies';
  override columns = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Nombre' },
    { key: 'fractionDigits', label: 'Decimales' },
    { key: 'active', label: 'Activa' },
  ];
}
