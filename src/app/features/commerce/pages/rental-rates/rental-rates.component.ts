import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { RateComponent } from '../../editors/rate/rate.component';
@Component({
  selector: 'tc-commerce-rental-rates',
  imports: [
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './rental-rates.component.html',
  styleUrl: './rental-rates.component.scss',
})
export class RentalRatesComponent extends CommercePage {
  override title = 'Tarifas contractuales';
  override mode = 'rental';
  override collection = 'rates';
  override columns = [
    { key: 'mode', label: 'Modo' },
    { key: 'amountExact', label: 'Importe' },
    { key: 'timeUnit', label: 'Unidad' },
    { key: 'minimumUnitsExact', label: 'Mínimo' },
    { key: 'validFrom', label: 'Inicio' },
    { key: 'validTo', label: 'Fin' },
  ];
  readonly editor = RateComponent;
}
