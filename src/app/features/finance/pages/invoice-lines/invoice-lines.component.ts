import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-invoice-lines',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './invoice-lines.component.html',
  styleUrl: './invoice-lines.component.scss',
})
export class InvoiceLinesComponent extends FinancePage {
  override title = 'Partidas congeladas';
  override mode = 'invoice';
  override collection = 'lines';
  override resource = '';
  override columns = [
    { key: 'number', label: 'Número' },
    { key: 'concept', label: 'Concepto' },
    { key: 'netAmountExact', label: 'Neto' },
    { key: 'taxFractionExact', label: 'Fracción impuesto' },
    { key: 'taxAmountExact', label: 'Impuesto' },
  ];
}
