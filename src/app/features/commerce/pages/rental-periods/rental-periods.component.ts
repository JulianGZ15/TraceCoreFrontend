import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
@Component({
  selector: 'tc-commerce-rental-periods',
  imports: [
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './rental-periods.component.html',
  styleUrl: './rental-periods.component.scss',
})
export class RentalPeriodsComponent extends CommercePage {
  override title = 'Periodos operativos';
  override mode = 'rental';
  override collection = 'periods';
  override columns = [
    { key: 'mode', label: 'Modo' },
    { key: 'validFrom', label: 'Inicio' },
    { key: 'validTo', label: 'Fin' },
    { key: 'reason', label: 'Motivo' },
  ];
}
