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
import { FrameworkComponent as FrameworkEditorComponent } from '../../editors/framework/framework.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
@Component({
  selector: 'tc-commerce-framework',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
    FrameworkEditorComponent,
    Pagination,
  ],
  templateUrl: './framework.component.html',
  styleUrl: './framework.component.scss',
})
export class FrameworkComponent extends CommercePage {
  override title = 'Contrato marco';
  readonly record = signal<Entity | null>(null);
  @ViewChild(FrameworkEditorComponent) child?: FrameworkEditorComponent;
  dirty() {
    return this.child?.dirty() ?? false;
  }
  readonly editor = FrameworkEditorComponent;
  readonly transition = TransitionComponent;
  readonly documents = signal<Entity[]>([]);
  done(v: Entity) {
    void this.router.navigate(['/comercial/marcos', v.uuid]);
  }
  override async afterLoad() {
    if (!this.id) return;
    const r = await this.api.get<Entity>('/frameworks/' + this.id, {}, this.stop);
    this.record.set(r);
    const docs = await this.api.get<Entity[]>(
      '/evidence',
      { frameworkUuid: this.id, offset: this.offset, limit: this.limit },
      this.stop,
    );
    this.documents.set(docs);
  }
  async upload(event: Event) {
    const input = event.target as HTMLInputElement,
      file = input.files?.[0];
    if (!file) return;
    try {
      await this.api.upload(file, 'frameworkUuid', this.id);
      input.value = '';
      await this.reload();
    } catch (e) {
      this.error.set(message(e));
    }
  }
}
