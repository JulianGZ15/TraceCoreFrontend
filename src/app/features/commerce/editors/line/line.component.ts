import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommerceEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { exact, instant, fraction } from '../../rules';
@Component({
  selector: 'tc-commerce-line-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './line.component.html',
  styleUrl: './line.component.scss',
})
export class LineComponent extends CommerceEditor {
  override resourceKind = 'lines';
  override permission = 'COMMERCIAL_MANAGE';
  uuid = '';
  setup() {
    const r = this.data.row;
    this.uuid = r?.uuid ?? crypto.randomUUID();
    this.title = r ? 'Editar partida' : 'Agregar partida';
    this.make(
      [
        {
          key: 'kind',
          label: 'Clase',
          type: 'select',
          choices: r ? [String(r.kind)] : ['EQUIPMENT', 'SERVICE'],
          required: true,
        },
        {
          key: 'modelUuid',
          label: 'Modelo',
          type: 'lookup',
          resource: 'model-options',
          readonly: !!r,
        },
        { key: 'concept', label: 'Concepto', required: true, max: 500 },
        { key: 'quantity', label: 'Cantidad', type: 'decimal', required: true },
        { key: 'unit', label: 'Unidad (PIECE para equipos)', required: true, readonly: !!r },
        { key: 'unitPrice', label: 'Precio unitario', type: 'decimal', scale: 4, required: true },
        {
          key: 'discountFraction',
          label: 'Descuento · fracción 0–1',
          type: 'decimal',
          required: true,
        },
        { key: 'taxFraction', label: 'Impuesto · fracción 0–1', type: 'decimal', required: true },
      ],
      r
        ? {
            kind: r.kind,
            modelUuid: r.modelUuid,
            concept: r.concept,
            quantity: exact(r.quantityExact),
            unit: r.unit,
            unitPrice: exact(r.unitPriceExact),
            discountFraction: exact(r.discountFractionExact),
            taxFraction: exact(r.taxFractionExact),
          }
        : {
            kind: 'EQUIPMENT',
            quantity: '1',
            unit: 'PIECE',
            unitPrice: '0',
            discountFraction: '0',
            taxFraction: '0',
          },
    );
  }
  async submit() {
    const v = this.form.getRawValue(),
      r = this.data.row,
      o = this.data.summary!.order;
    const line = {
      uuid: this.uuid,
      lineNumber: r?.lineNumber ?? 1,
      kind: r?.kind ?? v['kind'],
      modelUuid: r?.modelUuid ?? (v['kind'] === 'EQUIPMENT' ? v['modelUuid'] : null),
      concept: v['concept'],
      quantity: v['quantity'],
      unit: r?.unit ?? v['unit'],
      unitPrice: v['unitPrice'],
      discountFraction: fraction(v['discountFraction']),
      taxFraction: fraction(v['taxFraction']),
    };
    if (!r) {
      const current = await this.api.get<import('../../models').Summary>(
        '/orders/' + o.uuid + '/summary',
      );
      if (current.order.version !== o.version)
        throw new Error('La orden cambió. Recarga antes de agregar la partida.');
      if (!current.nextLineNumber)
        throw new Error('La API no incluye el número de partida disponible.');
      line.lineNumber = current.nextLineNumber;
    }
    return r
      ? this.api.put<Entity>('/lines/' + r.uuid, {
          line,
          version: r.version,
          orderVersion: o.version,
        })
      : this.create('LINE', '/orders/' + o.uuid + '/lines', { line, orderVersion: o.version });
  }
}
