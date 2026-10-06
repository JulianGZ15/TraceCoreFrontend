import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-reversal',
  imports: [RouterLink, PageHeading, Feedback, SectionNavComponent, PendingRequestsComponent],
  templateUrl: './reversal.component.html',
  styleUrl: './reversal.component.scss',
})
export class ReversalComponent extends FinancePage {
  override title = 'Reverso financiero';
  override mode = 'detail';
  override collection = '';
  override resource = 'reversals';
  override columns = [];
}
