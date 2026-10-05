import { Component, signal, inject } from '@angular/core';
import { takeUntil } from 'rxjs';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommercePage } from '../../page';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { CommercePending } from '../../pending';
import { Entity, Field, Row, ReceiptDetail, MovementDetail, Summary } from '../../models';
import { form, message } from '../../rules';
@Component({
  selector: 'tc-commerce-return-create',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
    FieldsComponent,
  ],
  templateUrl: './return-create.component.html',
  styleUrl: './return-create.component.scss',
})
export class ReturnCreateComponent extends CommercePage {
  override title = 'Devolución administrativa de renta';
  override mode = 'rental';
  readonly pending = inject(CommercePending);
  readonly receipt = signal<ReceiptDetail | null>(null);
  readonly assignments = signal<Entity[]>([]);
  readonly saving = signal(false);
  key = crypto.randomUUID();
  fields: Field[] = [];
  form = form([]);
  charges: Record<string, string> = {};
  dirty() {
    return this.form.dirty || this.assignments().length > 0;
  }
  override async afterLoad() {
    if (this.form.dirty) return;
    this.fields = [
      { key: 'folio', label: 'Folio de devolución', required: true },
      {
        key: 'receiptUuid',
        label: 'Recepción administrativa del cliente final',
        type: 'lookup',
        resource: 'receipts',
        params: { originPartyUuid: String(this.rental()?.['endCustomerUuid'] ?? '') },
        required: true,
      },
      {
        key: 'assignmentUuid',
        label: 'Asignación raíz del contrato',
        type: 'lookup',
        resource: 'rentals/' + this.id + '/assignments',
        params: { rootsOnly: 'true' },
        required: true,
      },
      { key: 'reference', label: 'Referencia', type: 'textarea', required: true, max: 500 },
    ];
    this.form = form(this.fields);
    for (const key of ['receiptUuid', 'assignmentUuid'])
      this.form
        .get(key)!
        .valueChanges.pipe(takeUntil(this.ended))
        .subscribe(() => {
          this.receipt.set(null);
          this.assignments.set([]);
        });
  }
  async review() {
    const v = this.form.getRawValue();
    try {
      const receipt = await this.api.get<ReceiptDetail>('/receipts/' + v['receiptUuid']);
      const group = await this.api.get<Entity[]>('/assignments/' + v['assignmentUuid'] + '/group');
      if (
        !group.every(
          (x) =>
            x.agreementUuid === this.id &&
            x.state === 'ACTIVE' &&
            receipt.items.some((i) => i.assetUuid === x.assetUuid),
        )
      )
        throw new Error('La recepción debe contener el conjunto completo activo de esta renta.');
      this.receipt.set(receipt);
      this.assignments.set(group);
      for (const a of group) this.charges[a.uuid] = '';
    } catch (e) {
      this.error.set(message(e));
    }
  }
  async save() {
    this.form.markAllAsTouched();
    if (
      this.form.invalid ||
      !this.can('COMMERCIAL_FULFILL') ||
      !this.receipt() ||
      !this.assignments().length
    )
      return;
    this.saving.set(true);
    try {
      const v = this.form.getRawValue(),
        pieces = this.assignments().map((x) => ({
          assignmentUuid: x.uuid,
          receiptItemUuid: this.receipt()!.items.find((i) => i.assetUuid === x.assetUuid)!.uuid,
          pendingCharges: this.charges[x.uuid] || null,
        }));
      if (pieces.length > 500) throw new Error('Máximo 500 piezas en un grupo de devolución.');
      const result = await this.pending.create<{ returned: Entity }>('RETURN', '/returns', {
        requestKey: this.key,
        agreementUuid: this.id,
        folio: v['folio'],
        receiptUuid: this.receipt()!.receipt.uuid,
        reference: v['reference'],
        pieces,
      });
      this.form.markAsPristine();
      this.assignments.set([]);
      void this.router.navigate(['/comercial/devoluciones', result.returned.uuid]);
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.saving.set(false);
    }
  }
}
