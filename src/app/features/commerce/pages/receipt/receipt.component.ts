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
  selector: 'tc-commerce-receipt',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.scss',
})
export class ReceiptComponent extends CommercePage {
  override title = 'Recepción administrativa';
  readonly detail = signal<{ receipt: Entity; items: Entity[] } | null>(null);
  override async afterLoad() {
    this.detail.set(await this.api.get('/receipts/' + this.id, {}, this.stop));
  }
}
