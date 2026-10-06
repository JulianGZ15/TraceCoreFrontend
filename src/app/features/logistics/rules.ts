import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Field } from './models';
import { decimalValidator } from '../equipment/rules';
export { exact, numberText, prettyDate, scaled } from '../equipment/rules';
export { instant, message } from '../commerce/rules';
const labels: Record<string, string> = {
  DRAFT: 'Borrador',
  CHECKED: 'Carga comprobada',
  IN_TRANSIT: 'En tránsito',
  PARTIALLY_DELIVERED: 'Entrega parcial',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  PLANNED: 'Planificado',
  COMPLETED: 'Completado',
  OUTBOUND: 'Salida externa',
  RETURN: 'Retorno',
  TRANSFER: 'Traslado entre patios',
  MANUAL: 'Manual',
  RFID: 'RFID',
  TRUCK: 'Camión',
  VAN: 'Furgón',
  TRAILER: 'Remolque',
  PREPARATION: 'Preparación',
  DEPARTURE: 'Salida',
  ARRIVAL: 'Llegada',
  INCIDENT: 'Incidencia',
  MATCHED: 'Coincide',
  MISSING: 'Faltante',
  EXTRA: 'Extra',
  UNRESOLVED: 'No resuelto',
  NEW: 'Nueva',
  SERVICEABLE: 'En servicio declarado',
  UNDER_REPAIR: 'En reparación',
  SCRAPPED: 'Desechada',
  UNKNOWN: 'Desconocida',
  FIT: 'Apta declarada',
  UNFIT: 'No apta declarada',
  DAMAGED: 'Dañada',
  REPAIR: 'Reparación',
  STORAGE: 'Almacenamiento',
  RENTAL: 'Renta',
  CUSTOMER: 'Cliente',
  true: 'Sí',
  false: 'No',
};
export const label = (v: unknown) => (v == null ? 'Sin dato' : (labels[String(v)] ?? String(v)));
export function form(fields: Field[], values: Record<string, unknown> = {}) {
  const controls: Record<string, FormControl<string>> = {};
  for (const f of fields) {
    const validators = [Validators.maxLength(f.max ?? 1000)];
    if (f.required) validators.push(Validators.required);
    if (f.type === 'decimal') validators.push(decimalValidator(12, 6));
    if (f.type === 'integer') validators.push(Validators.pattern(/^[1-9]\d*$/));
    if (f.type === 'instant')
      validators.push((c) =>
        !c.value || (/(Z|[+-]\d{2}:\d{2})$/.test(c.value) && Number.isFinite(Date.parse(c.value)))
          ? null
          : { instant: true },
      );
    controls[f.key] = new FormControl(String(values[f.key] ?? ''), {
      nonNullable: true,
      validators,
    });
  }
  return new FormGroup(controls);
}
