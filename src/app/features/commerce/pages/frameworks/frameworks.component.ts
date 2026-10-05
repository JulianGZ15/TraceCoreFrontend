import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { FrameworkComponent } from '../../editors/framework/framework.component';
@Component({
  selector: 'tc-commerce-frameworks',
  imports: [
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './frameworks.component.html',
  styleUrl: './frameworks.component.scss',
})
export class FrameworksComponent extends CommercePage {
  override title = 'Contratos marco';
  override mode = 'directory';
  override collection = 'frameworks';
  override columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'state', label: 'Estado' },
    { key: 'validFrom', label: 'Inicio' },
    { key: 'validTo', label: 'Fin' },
  ];
  readonly editor = FrameworkComponent;
}
