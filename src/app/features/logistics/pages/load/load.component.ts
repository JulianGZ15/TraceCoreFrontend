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
  selector: 'tc-logistics-load',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './load.component.html',
  styleUrl: './load.component.scss',
})
export class LoadComponent extends LogisticsPage {
  override title = 'Carga congelada';
  override mode = 'manifest';
  override collection = 'items';
  override columns = [
    { key: 'rootAssetUuid', label: 'Raíz' },
    { key: 'grossWeightKgExact', label: 'Peso kg' },
    { key: 'allocationUuid', label: 'Asignación comercial' },
  ];
  open(row: Entity) {
    this.selected.set(row);
  }
  orderFor(r: Entity) {
    return (
      (this.rows().find((v) => v.record.uuid === r.uuid) as Row & { orderUuid?: string })
        ?.orderUuid ?? ''
    );
  }
}
