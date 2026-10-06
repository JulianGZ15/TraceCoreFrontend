import { ReversalComponent } from '../../editors/reversal/reversal.component';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-note',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './note.component.html',
  styleUrl: './note.component.scss',
})
export class NoteComponent extends FinancePage {
  override title = 'Nota de crédito';
  override mode = 'detail';
  override collection = 'lines';
  override resource = 'credit-notes';
  override columns = [
    { key: 'invoiceLineUuid', label: 'Partida' },
    { key: 'netAmountExact', label: 'Neto' },
    { key: 'taxAmountExact', label: 'Impuesto' },
  ];
  reverseNote() {
    void this.edit(ReversalComponent, {
      row: this.current()?.['note'] as import('../../models').Entity,
      resource: 'notes',
    });
  }
}
