import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Field } from './models';
import { decimalValidator, scaled } from '../equipment/rules';
export { exact, numberText, prettyDate } from '../equipment/rules';
export const labels: Record<string, string> = {
  OC: 'Compra',
  OV: 'Venta',
  OR: 'Renta',
  DRAFT: 'Borrador',
  APPROVED: 'Aprobada',
  CLOSED: 'Cerrada',
  CANCELLED: 'Cancelada',
  ACTIVE: 'Operación',
  STANDBY: 'Espera',
  PAUSED: 'Pausa',
  RESERVED: 'Reservada',
  DELIVERED: 'Entregada',
  SOLD: 'Vendida',
  RETURNED: 'Devuelta',
  PLANNED: 'Prevista',
  EQUIPMENT: 'Equipo',
  SERVICE: 'Servicio',
  HOUR: 'Hora',
  DAY: 'Día',
  MONTH: 'Mes',
  PROPORTIONAL: 'Proporcional',
  STARTED_PERIOD: 'Periodo iniciado',
  RELEASED: 'Liberada',
  CALLED: 'Ejecutada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  DEPOSIT: 'Depósito',
  LETTER: 'Carta',
  BOND: 'Fianza',
  NOT_DRAFT: 'La orden ya no es un borrador.',
  LINES_REQUIRED: 'Agrega al menos una partida.',
  INACTIVE_YARD: 'El patio está inactivo.',
  INACTIVE_MODEL: 'Hay un modelo inactivo.',
  TERMS_EXPIRED: 'Las condiciones comerciales vencieron.',
  RATE_COVERAGE_ACTIVE: 'Faltan tarifas de operación.',
  RATE_COVERAGE_STANDBY: 'Faltan tarifas de espera.',
  FINANCIAL_COMMITMENT_REQUIRED: 'Finanzas debe preparar o ampliar el compromiso de crédito.',
  FINANCIAL_REVIEW_REQUIRED: 'Se requiere revisión de crédito por finanzas.',
  VERSION_CHANGED: 'Otra operación cambió la versión del registro.',
  ELIGIBILITY_CHANGED: 'Cambió la elegibilidad o autorización del tercero.',
  COVERAGE_CONFLICT: 'Revisa vigencias, cobertura y solapamientos.',
  CALCULATION_CHANGED: 'La previsualización cambió; vuelve a calcular antes de registrar.',
  REQUEST_REUSED: 'La clave ya corresponde a otra solicitud; consulta el registro existente.',
  OPERATIONAL_RESTRICTION: 'Una restricción operativa impide confirmar.',
  DESTINATION_UNAVAILABLE: 'El destino ya no está disponible.',
  RENTAL_PARTIES_OR_FRAMEWORK_UNAVAILABLE: 'Revisa los terceros y la cobertura del contrato marco.',
};
export const label = (v: unknown) => (v == null ? 'Sin dato' : (labels[String(v)] ?? String(v)));
export function instant(v: unknown) {
  if (typeof v !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(v) || !Number.isFinite(Date.parse(v)))
    throw new Error('Indica fecha ISO con Z o desplazamiento UTC explícito.');
  return v;
}
export function form(fields: Field[], values: Record<string, unknown> = {}) {
  const controls: Record<string, FormControl<string>> = {};
  for (const f of fields) {
    const validators = [Validators.maxLength(f.max ?? 3000)];
    if (f.required) validators.push(Validators.required);
    if (f.type === 'decimal') validators.push(decimalValidator(14, f.scale ?? 8));
    if (f.type === 'integer') validators.push(Validators.pattern(/^[1-9]\d*$/));
    if (f.type === 'instant')
      validators.push((c) =>
        !c.value
          ? null
          : (() => {
              try {
                instant(c.value);
                return null;
              } catch {
                return { instant: true };
              }
            })(),
      );
    controls[f.key] = new FormControl(String(values[f.key] ?? ''), {
      nonNullable: true,
      validators,
    });
  }
  return new FormGroup(controls);
}
export function fraction(value: string) {
  if (scaled(value, 8) > scaled('1', 8))
    throw new Error('Descuento e impuesto deben ser fracciones entre 0 y 1.');
  return value;
}
export function message(e: unknown) {
  if (e && typeof e === 'object' && 'status' in e) {
    const status = (e as { status: number }).status;
    const reason = (e as { error?: { reason?: string } }).error?.reason;
    return status === 409
      ? 'Conflicto: ' +
          (reason ? label(reason) + ' ' : '') +
          'Conserva el borrador y consulta los datos antes de confirmar.'
      : status === 403
        ? 'No tienes capacidad para esta operación. Actualiza tus accesos.'
        : status === 404
          ? 'El registro no existe o no está disponible.'
          : status === 413
            ? 'El archivo supera 10 MiB.'
            : status === 503
              ? 'Almacenamiento no disponible.'
              : status === 400
                ? 'Datos inválidos: revisa campos, intervalos y referencias.'
                : 'Respuesta indeterminada: consulta el resultado antes de repetir.';
  }
  return e instanceof Error ? e.message : 'No se pudo completar la operación.';
}
