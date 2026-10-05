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
  selector: 'tc-commerce-billing',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
})
export class BillingComponent extends CommercePage {
  override title = 'Corte administrativo inmutable';
  readonly record = signal<Entity | null>(null);
  readonly slices = signal<Entity[]>([]);
  override async afterLoad() {
    const r = await this.api.get<Entity>('/billings/' + this.id, {}, this.stop);
    this.record.set(r);
    this.slices.set(r['slices'] as Entity[]);
  }
  rate(slice: Entity) {
    return slice['rateSnapshot'] as Entity | null;
  }
}
