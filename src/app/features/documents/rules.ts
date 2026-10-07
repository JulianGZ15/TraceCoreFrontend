import { DocumentVersion, Summary, Linked } from './models';
export function decisionAllowed(summary: Summary, version: DocumentVersion, action: string) {
  if (!summary.actions.approve || summary.document.state !== 'ACTIVE') return false;
  return action === 'REVOKE'
    ? version.state === 'APPROVED'
    : version.state === 'DRAFT' &&
        (action !== 'APPROVE' || version.uuid === summary.latest?.metadata.uuid);
}
export function validateFile(file: File) {
  if (
    file.size < 1 ||
    file.size > 10485760 ||
    !/\.(pdf|png|jpe?g)$/i.test(file.name) ||
    /[\\/\x00-\x1f\x7f]/.test(file.name)
  )
    throw new Error('Selecciona PDF, PNG o JPEG de 1 byte a 10 MiB, con nombre sin rutas.');
}
export function linkState(row: Linked) {
  const link = row.view.link;
  if (link.withdrawnAt) return 'Retirado';
  if (row.view.effective) return 'Efectivo';
  const at = row.evaluatedAt;
  if (Date.parse(link.validFrom) > Date.parse(at)) return 'Futuro';
  if (link.validTo && Date.parse(link.validTo) <= Date.parse(at)) return 'Vencido';
  return 'Histórico / no efectivo';
}
export const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
