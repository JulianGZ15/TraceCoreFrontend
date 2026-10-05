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
  selector: 'tc-commerce-return-detail',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './return-detail.component.html',
  styleUrl: './return-detail.component.scss',
})
export class ReturnDetailComponent extends CommercePage {
  override title = 'Devolución administrativa';
  readonly detail = signal<{ returned: Entity; items: Entity[] } | null>(null);
  override async afterLoad() {
    this.detail.set(await this.api.get('/returns/' + this.id, {}, this.stop));
  }
}
