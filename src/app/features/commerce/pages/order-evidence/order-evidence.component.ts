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
  selector: 'tc-commerce-order-evidence',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './order-evidence.component.html',
  styleUrl: './order-evidence.component.scss',
})
export class OrderEvidenceComponent extends CommercePage {
  override title = 'Evidencias comerciales';
  override mode = 'order';
  override collection = 'evidence';
  readonly uploadBusy = signal(false);
  async upload(event: Event) {
    const input = event.target as HTMLInputElement,
      file = input.files?.[0];
    if (!file) return;
    this.uploadBusy.set(true);
    try {
      await this.api.upload(file, 'orderUuid', this.id);
      input.value = '';
      await this.reload();
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.uploadBusy.set(false);
    }
  }
  async download(r: Entity) {
    try {
      await this.api.download(r.uuid, r.filename ?? 'evidencia');
    } catch (e) {
      this.error.set(message(e));
    }
  }
}
