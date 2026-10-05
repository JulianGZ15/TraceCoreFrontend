import { Component, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommercePage } from '../../page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { FieldsComponent } from '../../shared/fields/fields.component';
import {
  Entity,
  Summary,
  CreditContext,
  Preview,
  Field,
  Row,
  ReceiptDetail,
  ReturnDetail,
  MovementDetail,
} from '../../models';
import { form, message, instant, exact } from '../../rules';
@Component({
  selector: 'tc-commerce-rental-summary',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './rental-summary.component.html',
  styleUrl: './rental-summary.component.scss',
})
export class RentalSummaryComponent extends CommercePage {
  override title = 'Contrato de renta';
  override mode = 'rental';
  readonly names: Record<string, string> = {
    contractingPartyUuid: 'Contratante',
    distributorUuid: 'Distribuidor',
    endCustomerUuid: 'Cliente final',
    payerUuid: 'Pagador',
    siteUuid: 'Sitio',
    plannedFrom: 'Inicio previsto',
    plannedTo: 'Fin previsto',
    timezone: 'Zona contractual',
    responsibilities: 'Responsabilidades',
  };
  value(r: Entity, key: string) {
    const labels: Record<string, string> = {
      contractingPartyUuid: 'contractor',
      distributorUuid: 'distributor',
      endCustomerUuid: 'endCustomer',
      payerUuid: 'payer',
      siteUuid: 'site',
    };
    return key === 'plannedFrom' || key === 'plannedTo'
      ? this.date(r[key])
      : (this.summary()?.labels?.[labels[key]] ?? r[key] ?? 'Sin dato');
  }
}
