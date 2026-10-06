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
  selector: 'tc-logistics-checks',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './checks.component.html',
  styleUrl: './checks.component.scss',
})
export class ChecksComponent extends LogisticsPage {
  override title = 'Comprobaciones de carga';
  override mode = 'manifest';
  override collection = 'checks';
  override columns = [
    { key: 'method', label: 'Método' },
    { key: 'approved', label: 'Coincide' },
    { key: 'checkedAt', label: 'Fecha' },
  ];
  open(row: Entity) {
    this.selected.set(row);
  }
}
