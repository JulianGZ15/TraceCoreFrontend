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
import { OrderComponent } from '../../editors/order/order.component';
@Component({
  selector: 'tc-commerce-order-create',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
    OrderComponent,
  ],
  templateUrl: './order-create.component.html',
  styleUrl: './order-create.component.scss',
})
export class OrderCreateComponent extends CommercePage {
  override title = 'Nueva orden';
  readonly data = signal<import('../../models').EditorContext | null>(null);
  @ViewChild(OrderComponent) editor?: OrderComponent;
  dirty() {
    return this.editor?.dirty() ?? false;
  }
  override async afterLoad() {
    this.data.set({ yard: this.yard });
  }
  done(v: Entity) {
    void this.router.navigate(['/comercial/ordenes', v.uuid, 'general']);
  }
}
