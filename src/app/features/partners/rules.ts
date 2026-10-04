import { Period, Certificate, Verification } from './models';
export { toInstant } from '../access/assignment-time';
export const decimalPattern = /^(?:0|[1-9]\d{0,14})(?:\.\d{1,4})?$/;
export const scorePattern = /^(?:\d{1,2}(?:\.\d{1,2})?|100(?:\.0{1,2})?)$/;
export const uuidPattern = /^[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/;
export function exactAmount(value: string): string {
  if (typeof value !== 'string' || !decimalPattern.test(value))
    throw new Error('El backend no ofrece un importe decimal exacto compatible.');
  const [integer, fraction] = value.split('.');
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction ? '.' + fraction : '');
}
export function validity(p: Period, now = Date.now()): string {
  if (p.revokedAt) return 'Revocada';
  if (now < Date.parse(p.validFrom)) return 'Futura';
  return p.validTo && now >= Date.parse(p.validTo) ? 'Vencida' : 'Vigente';
}
export function localDate(now: number, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return ['year', 'month', 'day']
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join('-');
}
export function certificateState(c: Certificate, today: string): string {
  if (today < c.issuedOn) return 'Emisión futura';
  return c.expiresOn && today > c.expiresOn ? 'Vencida' : 'Vigente';
}
export function reviews(state: Verification): Verification[] {
  return state === 'PENDING'
    ? ['VERIFIED', 'REJECTED']
    : state === 'REJECTED'
      ? ['VERIFIED']
      : state === 'VERIFIED'
        ? ['REVOKED']
        : [];
}
const labels: Record<string, string> = {
  CUSTOMER: 'Cliente',
  SUPPLIER: 'Proveedor',
  OEM: 'Fabricante OEM',
  DISTRIBUTOR: 'Distribuidor',
  CONTRACTOR: 'Contratista',
  CARRIER: 'Transportista',
  INSURER: 'Aseguradora',
  PENDING: 'Pendiente',
  VERIFIED: 'Verificado',
  REJECTED: 'Rechazado',
  REVOKED: 'Revocado',
  APPROVED: 'Aprobado',
  CONDITIONAL: 'Condicional',
  FISCAL: 'Fiscal',
  COMMERCIAL: 'Comercial',
  DELIVERY: 'Entrega',
  OC: 'Compra (OC)',
  OV: 'Venta (OV)',
  OR: 'Renta (OR)',
  PARTY_INACTIVE: 'El tercero está inactivo.',
  ROLE_REQUIRED: 'Falta el rol comercial vigente.',
  AUTHORIZATION_REQUIRED: 'Falta autorización vigente para esta operación.',
  AVL_REQUIRED: 'Falta una evaluación del alcance solicitado.',
  AVL_NOT_APPROVED_OR_EXPIRED: 'La última evaluación no está aprobada o su revisión venció.',
  ALLOWED: 'Cumple las condiciones actuales.',
};
export function label(value: string): string {
  return labels[value] ?? value;
}
export function partnerError(error: unknown): string {
  if (error instanceof Error && !('status' in error)) return error.message;
  return '';
}
