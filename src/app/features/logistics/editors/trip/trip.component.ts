import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LogisticsEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { instant } from '../../rules';
@Component({
  selector: 'tc-logistics-trip-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './trip.component.html',
  styleUrl: './trip.component.scss',
})
export class TripComponent extends LogisticsEditor {
  override resourceKind = 'trip';
  override allowed() {
    return (
      !!this.data.summary &&
      this.access.manage(this.data.summary.manifest) &&
      ['DRAFT', 'CHECKED'].includes(this.data.summary.manifest.state)
    );
  }
  setup() {
    const s = this.data.summary;
    if (!s) throw new Error('Carga el manifiesto.');
    const r = this.data.row;
    this.title = r ? 'Corregir viaje' : 'Planificar viaje';
    const params = { manifestUuid: s.manifest.uuid, carrierUuid: s.carrierUuid ?? '' };
    const fields: Field[] = [
      {
        key: 'vehicleUuid',
        label: 'Vehículo principal',
        type: 'lookup',
        resource: 'transport-options',
        params: { ...params, kind: 'VEHICLE' },
        required: true,
      },
      {
        key: 'trailerUuid',
        label: 'Remolque opcional',
        type: 'lookup',
        resource: 'transport-options',
        params: { ...params, kind: 'TRAILER' },
      },
      {
        key: 'driverUuid',
        label: 'Chofer',
        type: 'lookup',
        resource: 'transport-options',
        params: { ...params, kind: 'DRIVER' },
        required: true,
      },
      { key: 'plannedDeparture', label: 'Salida prevista', type: 'instant', required: true },
      { key: 'eta', label: 'Llegada prevista (ETA)', type: 'instant', required: true },
      { key: 'reason', label: 'Motivo de corrección', type: 'textarea', required: !!r, max: 500 },
    ];
    this.make(fields, {
      ...r,
      plannedDeparture: r?.plannedDeparture ?? new Date(Date.now() + 300000).toISOString(),
      eta: r?.eta ?? new Date(Date.now() + 7200000).toISOString(),
      reason: '',
    });
  }
  submit() {
    const s = this.data.summary!,
      r = this.data.row,
      v = this.form.getRawValue();
    const body = {
      ...v,
      trailerUuid: v['trailerUuid'] || null,
      plannedDeparture: instant(v['plannedDeparture']),
      eta: instant(v['eta']),
      version: r?.version ?? s.manifest.version,
      manifestVersion: s.manifest.version,
    };
    return r
      ? this.api.put<Entity>('/manifests/' + s.manifest.uuid + '/trip', body)
      : this.api.post<Entity>('/manifests/' + s.manifest.uuid + '/trip', {
          ...body,
          carrierUuid: s.carrierUuid,
        });
  }
}
