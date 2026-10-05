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
  selector: 'tc-commerce-receipt-create',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    SectionNavComponent,
    PendingRequestsComponent,
    FieldsComponent,
  ],
  templateUrl: './receipt-create.component.html',
  styleUrl: './receipt-create.component.scss',
})
export class ReceiptCreateComponent extends CommercePage {
  override title = 'Recepción administrativa';
  readonly pending = inject(CommercePending);
  readonly physical = signal<MovementDetail | null>(null);
  readonly chosen = signal<string[]>([]);
  readonly saving = signal(false);
  key = crypto.randomUUID();
  fields: Field[] = [];
  form = form([]);
  readonly conditions = ['UNKNOWN', 'NEW', 'SERVICEABLE', 'DAMAGED', 'UNDER_REPAIR', 'SCRAPPED'];
  readonly captures: Record<
    string,
    { acceptance: string; condition: string; observation: string }
  > = {};
  dirty() {
    return this.form.dirty || this.chosen().length > 0;
  }
  get roots() {
    return [...new Set(this.physical()?.items.map((i) => i.rootAssetUuid ?? i.assetUuid!) ?? [])];
  }
  group(root: string) {
    return this.physical()?.items.filter((i) => i.rootAssetUuid === root) ?? [];
  }
  override async afterLoad() {
    if (this.form.dirty) return;
    const orderUuid = this.route.snapshot.queryParamMap.get('orderUuid') ?? '';
    this.fields = [
      { key: 'folio', label: 'Folio de recepción', required: true },
      {
        key: 'originPartyUuid',
        label: 'Origen',
        type: 'lookup',
        resource: 'party-options',
        params: { purpose: 'ORIGIN' },
        required: true,
      },
      {
        key: 'orderUuid',
        label: 'OC aprobada (opcional)',
        type: 'lookup',
        resource: 'orders/directory',
        params: { type: 'OC', state: 'APPROVED' },
      },
      { key: 'lineUuid', label: 'Partida de OC para las raíces seleccionadas', type: 'text' },
      {
        key: 'movementUuid',
        label: 'Movimiento completado',
        type: 'lookup',
        resource: 'movement-options',
        required: true,
      },
      {
        key: 'reference',
        label: 'Referencia administrativa',
        type: 'textarea',
        required: true,
        max: 500,
      },
    ];
    this.form = form(this.fields, { orderUuid });
    if (orderUuid) await this.orderChanged(orderUuid);
    this.form
      .get('movementUuid')!
      .valueChanges.pipe(takeUntil(this.ended))
      .subscribe(() => {
        this.physical.set(null);
        this.chosen.set([]);
      });
    this.form
      .get('orderUuid')!
      .valueChanges.pipe(takeUntil(this.ended))
      .subscribe((id) => void this.orderChanged(id));
  }
  async orderChanged(id: string) {
    this.fields = this.fields.map((f) =>
      f.key === 'lineUuid'
        ? {
            ...f,
            type: id ? 'lookup' : 'text',
            resource: id ? 'orders/' + id + '/lines' : undefined,
            readonly: !id,
          }
        : f,
    );
    if (id) {
      try {
        const s = await this.api.get<Summary>('/orders/' + id + '/summary');
        if (s.order.type !== 'OC' || s.order.yardUuid !== this.yard)
          throw new Error('Selecciona OC del mismo patio.');
        this.form.patchValue({ originPartyUuid: s.order.partyUuid }, { emitEvent: false });
      } catch (e) {
        this.error.set(message(e));
      }
    } else this.form.patchValue({ lineUuid: '' }, { emitEvent: false });
  }
  async inspect() {
    const id = this.form.get('movementUuid')!.value;
    if (!id) return;
    try {
      const p = await this.api.get<MovementDetail>('/movement-options/' + id, {
        yardUuid: this.yard,
      });
      this.physical.set(p);
      this.chosen.set([]);
      for (const i of p.items)
        this.captures[i.assetUuid!] = {
          acceptance: 'ACCEPTED',
          condition: String(i['receivedCondition'] ?? 'UNKNOWN'),
          observation: '',
        };
    } catch (e) {
      this.error.set(message(e));
    }
  }
  toggle(root: string, checked: boolean) {
    this.chosen.update((list) => (checked ? [...list, root] : list.filter((x) => x !== root)));
  }
  capture(id: string, key: 'acceptance' | 'condition' | 'observation', v: string) {
    this.captures[id][key] = v;
  }
  async save() {
    this.form.markAllAsTouched();
    if (
      this.form.invalid ||
      !this.can('COMMERCIAL_FULFILL') ||
      !this.physical() ||
      !this.chosen().length
    )
      return;
    this.saving.set(true);
    try {
      const v = this.form.getRawValue();
      if (v['orderUuid'] && !v['lineUuid']) throw new Error('Selecciona la partida de compra.');
      const pieces = this.physical()!
        .items.filter((i) => this.chosen().includes(i.rootAssetUuid!))
        .map((i) => ({
          lineUuid: v['orderUuid'] ? v['lineUuid'] : null,
          assetUuid: i.assetUuid,
          movementUuid: this.physical()!.movement.uuid,
          ...this.captures[i.assetUuid!],
        }));
      if (pieces.length > 500)
        throw new Error('Máximo 500 piezas por recepción; selecciona menos grupos completos.');
      if (pieces.some((p) => !p.observation.trim()))
        throw new Error('Documenta una observación por cada pieza de los grupos seleccionados.');
      const result = await this.pending.create<ReceiptDetail>('RECEIPT', '/receipts', {
        requestKey: this.key,
        folio: v['folio'],
        orderUuid: v['orderUuid'] || null,
        originPartyUuid: v['originPartyUuid'],
        yardUuid: this.yard,
        reference: v['reference'],
        pieces,
      });
      this.form.markAsPristine();
      this.chosen.set([]);
      void this.router.navigate(['/comercial/recepciones', result.receipt.uuid]);
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.saving.set(false);
    }
  }
}
