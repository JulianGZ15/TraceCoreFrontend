import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { ModeComponent } from '../../editors/mode/mode.component';
@Component({
  selector: 'tc-commerce-rental-assignments',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './rental-assignments.component.html',
  styleUrl: './rental-assignments.component.scss',
})
export class RentalAssignmentsComponent extends CommercePage {
  override title = 'Equipos en renta';
  override mode = 'rental';
  override collection = 'assignments';
  override columns = [
    { key: 'state', label: 'Estado' },
    { key: 'rootAssetUuid', label: 'Raíz' },
    { key: 'actualFrom', label: 'Inicio efectivo' },
    { key: 'actualTo', label: 'Fin efectivo' },
  ];
  readonly editor = ModeComponent;
}
