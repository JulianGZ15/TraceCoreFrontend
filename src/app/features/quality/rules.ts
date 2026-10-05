import { ValidatorFn } from '@angular/forms';
import { scaled, exact, prettyDate, uuidPattern } from '../equipment/rules';
import { toInstant as assignmentInstant } from '../access/assignment-time';
export { scaled, exact, prettyDate, uuidPattern };
/** Validate calendar/offset with the shared converter and retain subsecond precision. */
export function toInstant(value: string): string {
  const m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::([0-5]\d)(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/.exec(
    value,
  );
  if (!m) throw new Error('Indica fecha y desplazamiento UTC explícito: Z o ±HH:MM.');
  const at = assignmentInstant(m[1], m[4] === 'Z' ? '+00:00' : m[4])!;
  return at.slice(0, 16) + ':' + (m[2] ?? '00') + (m[3] ?? '') + 'Z';
}
export function signedDecimal(value: unknown): boolean {
  return typeof value === 'string' && /^-?(?:0|[1-9]\d{0,11})(?:\.\d{1,6})?$/.test(value);
}
export const signedValidator: ValidatorFn = (c) =>
  c.value == null || c.value === '' || signedDecimal(c.value) ? null : { decimal: true };
export function optionalExact(numeric: unknown, text: unknown) {
  return numeric == null && text == null ? null : exact(text);
}
const labels: Record<string, string> = {
  ASSET: 'Pieza completa',
  TRACE: 'Traza',
  HEAT: 'Colada',
  MODEL: 'Modelo',
  CATEGORY: 'Categoría',
  DRAFT: 'Borrador',
  APPROVED: 'Aprobado',
  RETIRED: 'Retirado',
  REGISTERED: 'Registrado',
  VERIFIED: 'Verificado',
  REJECTED: 'Rechazado',
  REVOKED: 'Revocado',
  PLANNED: 'Programado',
  RECORDED: 'Resultados registrados',
  CANCELLED: 'Cancelado',
  IN_PROGRESS: 'En ejecución',
  COMPLETED: 'Completado',
  PASS: 'Conforme',
  FAIL: 'No conforme',
  INCONCLUSIVE: 'Inconcluso',
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  PRESERVATION: 'Preservación',
  QUALITY: 'Calidad',
  SAFETY: 'Seguridad',
  DOCUMENTATION: 'Documentación',
  MAINTENANCE: 'Mantenimiento',
  INSPECTION_FAILURE: 'Falla de inspección',
  USE: 'Uso',
  DISPATCH: 'Despacho',
  BOTH: 'Uso y despacho',
  UNKNOWN: 'Desconocida',
  NEW: 'Nuevo',
  SERVICEABLE: 'Utilizable (declarado)',
  DAMAGED: 'Dañado',
  UNDER_REPAIR: 'En reparación',
  SCRAPPED: 'Descarte',
  REVOKED_REASON: 'Revocada',
  EXPIRED_OR_NOT_STARTED: 'Fuera de vigencia',
  CONTEXT_CHANGED: 'Cambió el contexto técnico',
  DISPATCH_RELEASE_MISSING_OR_STALE: 'Falta liberación vigente de despacho',
  MTR_MISSING: 'Falta cobertura MTR',
  NO_POLICY: 'Sin política aplicable',
  OPEN_HOLD: 'Retención abierta',
  CONDITION_NOT_SERVICEABLE: 'Condición no utilizable',
  INSPECTION_MISSING: 'Falta inspección',
  INSPECTION_EXPIRED: 'Inspección vencida',
  CERTIFICATION_MISSING: 'Falta certificación',
};
export const label = (v: string | null | undefined) => (v ? (labels[v] ?? v) : 'Sin dato');
export function reason(v: string) {
  const [key, ...detail] = v.split(':');
  return (labels[key] ?? key) + (detail.length ? ' · ' + detail.join(':') : '');
}

export function decimalDisplay(numeric: unknown, text: unknown, empty: string) {
  try {
    return optionalExact(numeric, text) ?? empty;
  } catch {
    return 'Backend incompatible: falta decimal exacto.';
  }
}
