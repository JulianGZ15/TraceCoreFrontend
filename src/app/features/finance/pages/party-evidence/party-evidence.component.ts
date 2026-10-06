import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-finance-party-evidence',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './party-evidence.component.html',
  styleUrl: './party-evidence.component.scss',
})
export class PartyEvidenceComponent extends FinancePage {
  override title = 'Evidencias financieras';
  override mode = 'party';
  override collection = 'evidence';
  override resource = '';
  override columns = [
    { key: 'mediaType', label: 'Tipo detectado' },
    { key: 'size', label: 'Bytes' },
    { key: 'sha256', label: 'SHA-256' },
  ];
}
