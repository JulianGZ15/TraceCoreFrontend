import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-invoice-notes',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './invoice-notes.component.html',
  styleUrl: './invoice-notes.component.scss',
})
export class InvoiceNotesComponent extends FinancePage {
  override title = 'Notas de crédito';
  override mode = 'invoice';
  override collection = 'notes';
  override resource = '';
  override columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'netAmountExact', label: 'Neto' },
    { key: 'taxAmountExact', label: 'Impuesto' },
    { key: 'totalAmountExact', label: 'Total' },
    { key: 'reversed', label: 'Revertida' },
  ];
}
