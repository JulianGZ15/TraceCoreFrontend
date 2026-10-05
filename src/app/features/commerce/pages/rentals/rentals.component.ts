import { LookupComponent } from '../../shared/lookup/lookup.component';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
@Component({
  selector: 'tc-commerce-rentals',
  imports: [
    LookupComponent,
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './rentals.component.html',
  styleUrl: './rentals.component.scss',
})
export class RentalsComponent extends CommercePage {
  override title = 'Contratos de renta';
  override mode = 'directory';
  override collection = 'rentals';
  override columns = [
    { key: 'state', label: 'Estado' },
    { key: 'plannedFrom', label: 'Inicio previsto' },
    { key: 'plannedTo', label: 'Fin previsto' },
  ];
}
