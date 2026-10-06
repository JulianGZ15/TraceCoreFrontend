import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Field } from './models';
import { decimalValidator, scaled, exact } from '../equipment/rules';
export { exact, numberText, prettyDate, scaled } from '../equipment/rules';
export { instant } from '../commerce/rules';
import { message as commonMessage } from '../commerce/rules';
const labels: Record<string, string> = {
  CALCULATION_CHANGED: 'La vista previa cambió; solicita otro cálculo.',
  VERSION_CONFLICT: 'El registro fue modificado; consulta la versión actual.',
  REQUEST_KEY_REUSED: 'El UUID ya corresponde a otra solicitud.',
  SOURCE_ALREADY_CHARGED: 'La fuente ya tiene un cargo.',
  AMOUNT_UNAVAILABLE: 'El importe ya no está disponible para esta operación.',
  CREDIT_RESTRICTION: 'La cuenta, exposición o límite bloquean esta operación.',
  FINANCIAL_DEPENDENCIES: 'Existen operaciones dependientes; revísalas antes de revertir.',
  FINANCIAL_STATE_CONFLICT: 'El estado o la vigencia no permiten esta operación.',
  FINANCIAL_DUPLICATE_OR_INVALID_REFERENCE: 'La referencia está duplicada o es incompatible.',
  FINANCIAL_RESTRICTION: 'Una regla financiera impide esta operación.',
  DRAFT: 'Borrador',
  POSTED: 'Confirmada',
  CANCELLED: 'Cancelada',
  ACTIVE: 'Activa',
  BLOCKED: 'Bloqueada',
  RECEIVABLE: 'Por cobrar',
  PAYABLE: 'Por pagar',
  SALE: 'Venta',
  PURCHASE: 'Compra',
  RENTAL: 'Renta',
  SERVICE: 'Servicio',
  MANUAL: 'Manual',
  INVOICE: 'Factura',
  PAYMENT: 'Pago',
  ALLOCATION: 'Aplicación',
  CREDIT_NOTE: 'Nota de crédito',
  true: 'Sí',
  false: 'No',
  OUTSIDE_VALIDITY: 'Fuera de vigencia',
  INACTIVE_PARTY: 'Tercero inactivo',
  RENTAL_ESTIMATE_REQUIRED: 'La OR necesita compromiso estimado',
  LIMIT_EXCEEDED: 'La exposición excede el límite',
  ORDER_NOT_CLOSED: 'Orden pendiente de cierre',
  SERVICE_NOT_CHARGED: 'Servicio sin cargo',
  SALE_NOT_CHARGED: 'Venta sin cargo',
  RENTAL_NOT_CHARGED: 'Corte sin cargo',
  CHARGES_NOT_INVOICED: 'Cargos sin facturar',
  ALREADY_SETTLED: 'Compromiso liquidado',
};
export const label = (v: unknown) => (v == null ? 'Sin dato' : (labels[String(v)] ?? String(v)));
export function message(error: unknown) {
  const e = error as { status?: number; error?: { reason?: string } };
  return e?.status === 409 && e.error?.reason
    ? 'Conflicto: ' +
        label(e.error.reason) +
        ' Conservamos el borrador; consulta los datos antes de confirmar.'
    : commonMessage(error);
}
export function form(fields: Field[], values: Record<string, unknown> = {}) {
  const controls: Record<string, FormControl<string>> = {};
  for (const f of fields) {
    const validators = [Validators.maxLength(f.max ?? 500)];
    if (f.required) validators.push(Validators.required);
    if (f.type === 'decimal') validators.push(decimalValidator(14, 8));
    if (f.type === 'integer') validators.push(Validators.pattern(/^[0-8]$/));
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
export function money(v: unknown, digits: number, positive = false) {
  const text = exact(v);
  const n = scaled(text, digits);
  if (n < 0n || (positive && n === 0n))
    throw new Error(
      'Indica un importe ' +
        (positive ? 'positivo' : 'no negativo') +
        ' con hasta ' +
        digits +
        ' decimales.',
    );
  return text;
}
export function optional(v: unknown) {
  return v === '' || v == null ? null : v;
}
export function entity(r: unknown): import('./models').Entity {
  const v = r as Record<string, import('./models').Entity>;
  return (
    v['invoice'] ?? v['payment'] ?? v['note'] ?? v['allocation'] ?? (r as import('./models').Entity)
  );
}
export function routeFor(operation: string, id: string) {
  const names: Record<string, string> = {
    INVOICE: 'facturas',
    PAYMENT: 'pagos',
    CREDIT_NOTE: 'notas',
    ACCOUNT: 'cuentas',
    REVERSAL: 'reversos',
  };
  return names[operation] ? '/finanzas/' + names[operation] + '/' + id : '/finanzas/cargos';
}
