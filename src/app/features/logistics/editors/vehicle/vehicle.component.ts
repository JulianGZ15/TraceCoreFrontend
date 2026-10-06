import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LogisticsEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { exact, instant, scaled } from '../../rules';
@Component({
  selector: 'tc-logistics-vehicle-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './vehicle.component.html',
  styleUrl: './vehicle.component.scss',
})
export class VehicleComponent extends LogisticsEditor {
  override resourceKind = 'vehicles';
  uuid = '';
  override allowed() {
    return this.session.can('LOGISTICS_MANAGE');
  }
  setup() {
    const r = this.data.row;
    this.uuid = r?.uuid ?? this.uuid ?? crypto.randomUUID();
    if (!this.uuid) this.uuid = crypto.randomUUID();
    this.title = (r ? 'Editar ' : 'Nuevo ') + 'vehículo';
    const fields: Field[] = [
      {
        key: 'carrierUuid',
        label: 'Transportista',
        type: 'lookup',
        required: true,
        resource: 'party-options',
      },
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        required: true,
        choices: ['TRUCK', 'VAN', 'TRAILER'],
      },
      { key: 'plate', label: 'Placa', type: 'text', required: true },
      { key: 'jurisdiction', label: 'Jurisdicción', type: 'text', required: true },
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'maxWeightKg', label: 'Capacidad kg', type: 'decimal', required: true },
      { key: 'maxPositions', label: 'Posiciones', type: 'integer', required: true },
      {
        key: 'active',
        label: 'Activo',
        type: 'select',
        required: true,
        choices: ['true', 'false'],
      },
    ];
    if (r) fields.find((f) => f.key === 'carrierUuid')!.readonly = true;
    this.make(fields, {
      ...r,
      active: r?.['active'] ?? 'true',
      type: r?.type ?? 'TRUCK',
      maxWeightKg: r ? exact(r.maxWeightKgExact ?? r['maxWeightKgExact']) : '',
      maxPositions: r?.['maxPositions'] ?? '1',
    });
  }
  submit() {
    const v = this.form.getRawValue();
    if (scaled(v['maxWeightKg'], 6) <= 0n) throw new Error('La capacidad debe ser positiva.');
    return this.api.post<Entity>('/vehicles', {
      ...v,
      uuid: this.uuid,
      version: this.data.row?.version ?? null,
      active: v['active'] === 'true',
      maxPositions: parseInt(v['maxPositions'], 10),
    });
  }
}
