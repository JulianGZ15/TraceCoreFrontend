import { Params } from '../../core/http/workspace-api';
import { uuidPattern } from '../documents/rules';
export function validateFilters(values: Params) {
  for (const [key, value] of Object.entries(values)) {
    if (!value) continue;
    if (key.endsWith('Uuid') && !uuidPattern.test(String(value)))
      throw new Error('UUID inválido: ' + key);
    if (
      ['from', 'to'].includes(key) &&
      (!/(?:Z|[+-]\d{2}:\d{2})$/.test(String(value)) || !Number.isFinite(Date.parse(String(value))))
    )
      throw new Error('Las fechas requieren instante ISO con desplazamiento UTC explícito.');
  }
  if (
    values['from'] &&
    values['to'] &&
    Date.parse(String(values['from'])) >= Date.parse(String(values['to']))
  )
    throw new Error('El fin debe ser posterior al inicio; el intervalo es [inicio, fin).');
}
