import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { InsuranceComponent } from '../../editors/insurance/insurance.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
@Component({
  selector: 'tc-commerce-order-policies',
  imports: [
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './order-policies.component.html',
  styleUrl: './order-policies.component.scss',
})
export class OrderPoliciesComponent extends CommercePage {
  override title = 'Pólizas de la orden';
  override mode = 'order';
  override collection = 'policies';
  override columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'insuredAmountExact', label: 'Importe asegurado' },
    { key: 'validTo', label: 'Fin' },
    { key: 'cancellationReason', label: 'Cancelación' },
  ];
  readonly editor = InsuranceComponent;
  readonly transition = TransitionComponent;
}
