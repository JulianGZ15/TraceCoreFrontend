import { Component, DestroyRef, inject } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { CommerceEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { instant, message } from '../../rules';
@Component({
  selector: 'tc-commerce-allocation-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './allocation.component.html',
  styleUrl: './allocation.component.scss',
})
export class AllocationComponent extends CommerceEditor {
  override permission = 'COMMERCIAL_MANAGE';
  key = crypto.randomUUID();
  private readonly destroyRef = inject(DestroyRef);
  private readonly lookupStop = new Subject<void>();
  private selection?: Subscription;
  private lookupSequence = 0;
  constructor() {
    super();
    this.destroyRef.onDestroy(() => {
      ++this.lookupSequence;
      this.lookupStop.next();
      this.lookupStop.complete();
      this.selection?.unsubscribe();
    });
  }
  override allowed() {
    return super.allowed() && this.access.can('RESERVATION_MANAGE', this.data.yard);
  }
  setup() {
    this.title = 'Asignar una raíz y reservar su conjunto';
    this.make(
      [
        {
          key: 'lineUuid',
          label: 'Partida de equipo',
          type: 'lookup',
          resource: 'orders/' + this.data.summary!.order.uuid + '/lines',
          required: true,
        },
        {
          key: 'rootAssetUuid',
          label: 'Raíz física del patio',
          type: 'lookup',
          resource: 'asset-options',
          required: true,
        },
        { key: 'from', label: 'Inicio previsto', type: 'instant', required: true },
        { key: 'to', label: 'Fin previsto', type: 'instant', required: true },
        { key: 'expiresAt', label: 'Expiración de reserva', type: 'instant', required: true },
        {
          key: 'ownerAuthorizationReference',
          label: 'Autorización del propietario tercero',
          max: 500,
        },
      ],
      {
        lineUuid: this.data.row?.uuid,
        from: this.data.rental?.plannedFrom,
        to: this.data.rental?.plannedTo,
      },
    );
    this.selection?.unsubscribe();
    this.selection = this.form
      .get('lineUuid')!
      .valueChanges.subscribe((id) => void this.selectLine(id));
    void this.selectLine(this.form.get('lineUuid')!.value);
  }
  private async selectLine(id: unknown) {
    this.lookupStop.next();
    const sequence = ++this.lookupSequence,
      epoch = this.session.epoch();
    this.form.get('rootAssetUuid')!.reset();
    this.form.get('rootAssetUuid')!.disable();
    if (typeof id !== 'string' || !id) return;
    try {
      const l = await this.api.get<Entity>('/lines/' + id, {}, this.lookupStop);
      if (sequence !== this.lookupSequence || epoch !== this.session.epoch()) return;
      if (l['kind'] !== 'EQUIPMENT' || !l.modelUuid)
        throw new Error('Selecciona una partida de equipo.');
      const modelUuid = l.modelUuid;
      this.fields = this.fields.map((f) =>
        f.key === 'rootAssetUuid' ? { ...f, params: { modelUuid } } : f,
      );
      this.form.get('rootAssetUuid')!.enable();
    } catch (e) {
      if (sequence === this.lookupSequence && epoch === this.session.epoch())
        this.error.set(message(e));
    }
  }
  async submit() {
    const v = this.form.getRawValue();
    const result = await this.pending.create<Entity[]>('ALLOCATION', '/allocations', {
      ...v,
      requestKey: this.key,
      from: instant(v['from']),
      to: instant(v['to']),
      expiresAt: instant(v['expiresAt']),
      ownerAuthorizationReference: v['ownerAuthorizationReference'] || null,
    });
    return result[0];
  }
}
