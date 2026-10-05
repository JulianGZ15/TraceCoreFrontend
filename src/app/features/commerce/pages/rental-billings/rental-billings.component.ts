import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
@Component({
  selector: 'tc-commerce-rental-billings',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './rental-billings.component.html',
  styleUrl: './rental-billings.component.scss',
})
export class RentalBillingsComponent extends CommercePage {
  override title = 'Cortes administrativos';
  override mode = 'rental';
  override collection = 'billings';
  override columns = [
    { key: 'periodFrom', label: 'Inicio' },
    { key: 'periodTo', label: 'Fin' },
    { key: 'amountExact', label: 'Importe' },
    { key: 'currency', label: 'Divisa' },
  ];
}
