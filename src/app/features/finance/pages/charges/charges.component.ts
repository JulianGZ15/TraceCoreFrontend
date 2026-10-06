import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-charges',
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
  templateUrl: './charges.component.html',
  styleUrl: './charges.component.scss',
})
export class ChargesComponent extends FinancePage {
  override title = 'Cargos por cumplimiento';
  override mode = 'directory';
  override collection = 'charges/directory';
  override resource = '';
  override columns = [
    { key: 'kind', label: 'Origen' },
    { key: 'direction', label: 'Dirección' },
    { key: 'currency', label: 'Divisa' },
    { key: 'netAmountExact', label: 'Neto' },
    { key: 'taxAmountExact', label: 'Impuesto' },
    { key: 'remainingNetExact', label: 'Neto sin facturar' },
  ];
}
