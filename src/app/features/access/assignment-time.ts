import { Assignment } from '../../core/http/api';
export function assignmentState(a: Assignment, now = Date.now()): string {
  if (a.revokedAt) return 'Revocada';
  if (now < Date.parse(a.validFrom)) return 'Futura';
  if (a.validTo && now >= Date.parse(a.validTo)) return 'Vencida';
  return 'Vigente';
}
export function toInstant(local: string, offset: string): string | null {
  if (!local) return null;
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ||
    !/^([+-])(?:0\d|1[0-4]):[0-5]\d$/.test(offset) ||
    (/^[-+]14:/.test(offset) && !offset.endsWith(':00'))
  )
    throw new Error('Indica una fecha y un desplazamiento UTC válidos.');
  const [date, time] = local.split('T'),
    [y, m, d] = date.split('-').map(Number),
    [h, min] = time.split(':').map(Number);
  const calendar = new Date(Date.UTC(y, m - 1, d, h, min));
  if (
    calendar.getUTCFullYear() !== y ||
    calendar.getUTCMonth() !== m - 1 ||
    calendar.getUTCDate() !== d ||
    h > 23 ||
    min > 59
  )
    throw new Error('La fecha indicada no existe.');
  const parsed = new Date(local + offset);
  if (!Number.isFinite(parsed.getTime()))
    throw new Error('Revisa la fecha y su desplazamiento UTC.');
  return parsed.toISOString();
}
