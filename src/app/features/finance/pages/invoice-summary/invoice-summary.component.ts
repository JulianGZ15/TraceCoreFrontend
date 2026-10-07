import { ContextualLinksComponent } from '../../../documents/shared/contextual-links/contextual-links.component';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-invoice-summary',
  imports: [ContextualLinksComponent,RouterLink, PageHeading, Feedback, SectionNavComponent, PendingRequestsComponent],
  templateUrl: './invoice-summary.component.html',
  styleUrl: './invoice-summary.component.scss',
})
export class InvoiceSummaryComponent extends FinancePage {
  override title = 'Expediente de factura';
  override mode = 'invoice';
  override collection = '';
  override resource = '';
  override columns = [];
}
