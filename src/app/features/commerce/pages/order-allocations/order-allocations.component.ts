import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { AllocationComponent } from '../../editors/allocation/allocation.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
@Component({
  selector: 'tc-commerce-order-allocations',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './order-allocations.component.html',
  styleUrl: './order-allocations.component.scss',
})
export class OrderAllocationsComponent extends CommercePage {
  override title = 'Asignaciones físicas de la orden';
  override mode = 'order';
  override collection = 'allocations';
  override columns = [
    { key: 'state', label: 'Estado' },
    { key: 'rootAssetUuid', label: 'Raíz' },
    { key: 'plannedFrom', label: 'Inicio' },
    { key: 'plannedTo', label: 'Fin' },
  ];
  readonly editor = AllocationComponent;
  readonly transition = TransitionComponent;
}
