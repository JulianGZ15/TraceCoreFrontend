import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { GuaranteeComponent } from '../../editors/guarantee/guarantee.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
@Component({
  selector: 'tc-commerce-rental-guarantees',
  imports: [
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './rental-guarantees.component.html',
  styleUrl: './rental-guarantees.component.scss',
})
export class RentalGuaranteesComponent extends CommercePage {
  override title = 'Garantías administrativas';
  override mode = 'rental';
  override collection = 'guarantees';
  override columns = [
    { key: 'type', label: 'Tipo' },
    { key: 'amountExact', label: 'Importe' },
    { key: 'state', label: 'Estado' },
    { key: 'validTo', label: 'Fin' },
  ];
  readonly editor = GuaranteeComponent;
  readonly transition = TransitionComponent;
}
