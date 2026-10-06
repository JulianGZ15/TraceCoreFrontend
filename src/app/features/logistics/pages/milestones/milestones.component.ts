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
import { MilestoneComponent } from '../../editors/milestone/milestone.component';
@Component({
  selector: 'tc-logistics-milestones',
  imports: [
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './milestones.component.html',
  styleUrl: './milestones.component.scss',
})
export class MilestonesComponent extends LogisticsPage {
  override title = 'Hitos e incidencias';
  override mode = 'manifest';
  override collection = 'milestones';
  override columns = [
    { key: 'type', label: 'Tipo' },
    { key: 'effectiveAt', label: 'Fecha efectiva' },
    { key: 'recordedAt', label: 'Registrado' },
    { key: 'reference', label: 'Referencia' },
  ];
  open(row: Entity) {
    this.selected.set(row);
  }
  add() {
    void this.edit(MilestoneComponent);
  }
}
