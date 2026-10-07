import { ContextualLinksComponent } from '../../../documents/shared/contextual-links/contextual-links.component';
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
import { TransitionComponent } from '../../editors/transition/transition.component';
@Component({
  selector: 'tc-commerce-order-summary',
  imports: [ContextualLinksComponent,
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
    OrderComponent,
  ],
  templateUrl: './order-summary.component.html',
  styleUrl: './order-summary.component.scss',
})
export class OrderSummaryComponent extends CommercePage {
  override title = 'Expediente de orden';
  override mode = 'order';
  readonly blocks = signal<string[]>([]);
  readonly editing = signal(false);
  readonly transition = TransitionComponent;
  @ViewChild(OrderComponent) editor?: OrderComponent;
  dirty() {
    return this.editor?.dirty() ?? false;
  }
  override async afterLoad() {
    const id = this.id;
    const blocks = await this.api.get<string[]>('/orders/' + id + '/approval-check', {}, this.stop);
    if (this.id === id) this.blocks.set(blocks);
  }
  snapshotText(v: unknown) {
    return JSON.stringify(
      v,
      (k, value) =>
        ['netAmount', 'taxAmount', 'totalAmount', 'creditLimit'].includes(k) ? undefined : value,
      2,
    );
  }
  done() {
    this.editing.set(false);
    void this.reload();
  }
  snapshotValue(v: unknown, key: string) {
    const o = v as Record<string, unknown>;
    return key.endsWith('Exact')
      ? this.numberText(o[key])
      : Array.isArray(o[key])
        ? (o[key] as string[]).join(', ')
        : (o[key] ?? 'Sin dato');
  }
  terms(v: unknown) {
    return (v as Record<string, unknown>)['commercialTerms'] as Record<string, unknown> | null;
  }
}
