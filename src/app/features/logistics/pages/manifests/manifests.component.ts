import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { LogisticsPage } from '../../page';
import { Entity, Row, Summary } from '../../models';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
@Component({
  selector: 'tc-logistics-manifests',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './manifests.component.html',
  styleUrl: './manifests.component.scss',
})
export class ManifestsComponent extends LogisticsPage {
  override title = 'Manifiestos';
  override mode = 'directory';
  override collection = 'manifests/directory';
  override columns = [
    { key: 'type', label: 'Tipo' },
    { key: 'state', label: 'Estado' },
    { key: 'createdAt', label: 'Creado' },
  ];
  open(row: Entity) {
    void this.router.navigate(['/logistica/manifiestos', row.uuid]);
  }
  readonly states = [
    'DRAFT',
    'CHECKED',
    'IN_TRANSIT',
    'PARTIALLY_DELIVERED',
    'DELIVERED',
    'CANCELLED',
  ];
  readonly types = ['OUTBOUND', 'RETURN', 'TRANSFER'];
}
