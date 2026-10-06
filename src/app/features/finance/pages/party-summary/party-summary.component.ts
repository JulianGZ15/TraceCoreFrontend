import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-party-summary',
  imports: [RouterLink, PageHeading, Feedback, SectionNavComponent, PendingRequestsComponent],
  templateUrl: './party-summary.component.html',
  styleUrl: './party-summary.component.scss',
})
export class PartySummaryComponent extends FinancePage {
  override title = 'Resumen financiero';
  override mode = 'party';
  override collection = '';
  override resource = '';
  override columns = [];
}
