import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LogisticsEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { exact, instant, scaled } from '../../rules';
@Component({
  selector: 'tc-logistics-driver-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './driver.component.html',
  styleUrl: './driver.component.scss',
})
export class DriverComponent extends LogisticsEditor {
  override resourceKind = 'drivers';
  uuid = '';
  override allowed() {
    return this.session.can('LOGISTICS_MANAGE');
  }
  setup() {
    const r = this.data.row;
    this.uuid = r?.uuid ?? this.uuid ?? crypto.randomUUID();
    if (!this.uuid) this.uuid = crypto.randomUUID();
    this.title = (r ? 'Editar ' : 'Nuevo ') + 'chofer';
    const fields: Field[] = [
      {
        key: 'carrierUuid',
        label: 'Transportista',
        type: 'lookup',
        required: true,
        resource: 'party-options',
      },
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'phone', label: 'Teléfono', type: 'text', required: true },
      { key: 'license', label: 'Licencia', type: 'text', required: true },
      { key: 'licenseType', label: 'Tipo de licencia', type: 'text', required: true },
      { key: 'jurisdiction', label: 'Jurisdicción', type: 'text', required: true },
      {
        key: 'licenseExpiresAt',
        label: 'Vencimiento de licencia',
        type: 'instant',
        required: true,
      },
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
      maxWeightKg: '',
      maxPositions: r?.['maxPositions'] ?? '1',
    });
  }
  submit() {
    const v = this.form.getRawValue();
    return this.api.post<Entity>('/drivers', {
      ...v,
      uuid: this.uuid,
      version: this.data.row?.version ?? null,
      active: v['active'] === 'true',
      licenseExpiresAt: instant(v['licenseExpiresAt']),
    });
  }
}
