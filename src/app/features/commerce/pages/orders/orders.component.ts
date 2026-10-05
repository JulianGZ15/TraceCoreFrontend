import { LookupComponent } from '../../shared/lookup/lookup.component';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
@Component({
  selector: 'tc-commerce-orders',
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
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent extends CommercePage {
  override title = 'Órdenes comerciales';
  override mode = 'directory';
  override collection = 'orders/directory';
  override columns = [
    { key: 'type', label: 'Tipo' },
    { key: 'state', label: 'Estado' },
    { key: 'currency', label: 'Divisa' },
  ];
}
