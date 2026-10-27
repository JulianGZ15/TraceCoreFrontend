import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LineComponent } from '../../editors/line/line.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
import { Entity } from '../../models';
@Component({
  selector: 'tc-commerce-order-lines',
  imports: [
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './order-lines.component.html',
  styleUrl: './order-lines.component.scss',
})
export class OrderLinesComponent extends CommercePage {
  override title = 'Partidas de la orden';
  override mode = 'order';
  override collection = 'lines';
  override columns = [
    { key: 'kind', label: 'Clase' },
    { key: 'quantityExact', label: 'Cantidad' },
    { key: 'unitPriceExact', label: 'Precio' },
    { key: 'totalAmountExact', label: 'Total' },
  ];
  readonly editor = LineComponent;
  readonly transition = TransitionComponent;

  openLine(row: Entity) {
    if (this.can('COMMERCIAL_MANAGE') && this.summary()?.order?.state === 'DRAFT') {
      this.selected.set(null);
      void this.edit(this.editor, row);
      return;
    }
    this.selected.set(row);
  }
}
