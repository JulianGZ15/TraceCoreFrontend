import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommerceEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { exact, instant, fraction } from '../../rules';
@Component({
  selector: 'tc-commerce-rate-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './rate.component.html',
  styleUrl: './rate.component.scss',
})
export class RateComponent extends CommerceEditor {
  override resourceKind = 'rates';
  override permission = 'RENTAL_MANAGE';
  uuid = '';
  setup() {
    const r = this.data.row;
    this.uuid = r?.uuid ?? crypto.randomUUID();
    this.title = r ? 'Corregir tarifa DRAFT' : 'Agregar tarifa';
    this.make(
      [
        {
          key: 'lineUuid',
          label: 'Partida',
          type: 'lookup',
          resource: 'orders/' + this.data.summary!.order.uuid + '/lines',
          required: true,
          readonly: !!r,
        },
        {
          key: 'mode',
          label: 'Modo',
          type: 'select',
          choices: ['ACTIVE', 'STANDBY'],
          required: true,
        },
        {
          key: 'amount',
          label: 'Importe por unidad temporal',
          type: 'decimal',
          scale: 4,
          required: true,
        },
        {
          key: 'timeUnit',
          label: 'Unidad temporal',
          type: 'select',
          choices: ['HOUR', 'DAY', 'MONTH'],
          required: true,
        },
        {
          key: 'rounding',
          label: 'Redondeo',
          type: 'select',
          choices: ['PROPORTIONAL', 'STARTED_PERIOD'],
          required: true,
        },
        { key: 'minimumUnits', label: 'Mínimo por segmento', type: 'decimal', required: true },
        { key: 'from', label: 'Inicio con offset', type: 'instant', required: true },
        { key: 'to', label: 'Fin con offset (opcional)', type: 'instant' },
        { key: 'reference', label: 'Referencia contractual', required: true, max: 500 },
      ],
      r
        ? {
            lineUuid: r.lineUuid,
            mode: r.mode,
            amount: exact(r.amountExact),
            timeUnit: r['timeUnit'],
            rounding: r['rounding'],
            minimumUnits: exact(r.minimumUnitsExact),
            from: r.validFrom,
            to: r.validTo ?? '',
            reference: r.reference,
          }
        : {
            mode: 'ACTIVE',
            amount: '0',
            timeUnit: 'DAY',
            rounding: 'PROPORTIONAL',
            minimumUnits: '0',
            from: this.data.rental?.plannedFrom,
            to: this.data.rental?.plannedTo,
          },
    );
  }
  submit() {
    const v = this.form.getRawValue(),
      r = this.data.row,
      rental = this.data.rental!,
      o = this.data.summary!.order;
    const rate = {
      ...v,
      uuid: this.uuid,
      lineUuid: r?.lineUuid ?? v['lineUuid'],
      from: instant(v['from']),
      to: v['to'] ? instant(v['to']) : null,
    };
    return r
      ? this.api.put<Entity>('/rates/' + r.uuid, {
          rate,
          version: r.version,
          rentalVersion: rental.version,
          orderVersion: o.version,
        })
      : this.create('RATE', '/rentals/' + rental.uuid + '/rates', rate);
  }
}
