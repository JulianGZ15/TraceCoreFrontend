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
import { TripComponent as TripComponentEditor } from '../../editors/trip/trip.component';
@Component({
  selector: 'tc-logistics-trip',
  imports: [
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './trip.component.html',
  styleUrl: './trip.component.scss',
})
export class TripComponent extends LogisticsPage {
  override title = 'Viaje y transporte';
  override mode = 'manifest';
  override collection = 'trip/revisions';
  override columns = [
    { key: 'changedAt', label: 'Fecha' },
    { key: 'reason', label: 'Motivo' },
    { key: 'actorUuid', label: 'Actor' },
  ];
  open(row: Entity) {
    this.selected.set(row);
  }
  plan() {
    void this.edit(TripComponentEditor, this.summary()?.trip ?? undefined);
  }
  revisionDate(r: Entity, key: string) {
    const t = r[key] as Entity | undefined;
    return this.date(t?.eta);
  }
}
