import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-party-credit',
  imports: [RouterLink, PageHeading, Feedback, SectionNavComponent, PendingRequestsComponent],
  templateUrl: './party-credit.component.html',
  styleUrl: './party-credit.component.scss',
})
export class PartyCreditComponent extends FinancePage {
  override title = 'Cuenta del tercero';
  override mode = 'party';
  override collection = '';
  override resource = '';
  override columns = [];
}
