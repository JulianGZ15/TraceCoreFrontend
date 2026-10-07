import { ContextualLinksComponent } from '../../../documents/shared/contextual-links/contextual-links.component';
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
import { CancelComponent } from '../../editors/cancel/cancel.component';
@Component({
  selector: 'tc-logistics-manifest-summary',
  imports: [ContextualLinksComponent,RouterLink, PageHeading, Feedback, SectionNavComponent, PendingRequestsComponent],
  templateUrl: './manifest-summary.component.html',
  styleUrl: './manifest-summary.component.scss',
})
export class ManifestSummaryComponent extends LogisticsPage {
  override title = 'Resumen del manifiesto';
  override mode = 'manifest';
  override collection = '';
  override columns = [];
  open(row: Entity) {
    this.selected.set(row);
  }
  cancel() {
    void this.edit(CancelComponent);
  }
}
