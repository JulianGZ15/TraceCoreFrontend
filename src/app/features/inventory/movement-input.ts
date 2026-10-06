import { RootInput } from './models';
/** Shared inventory/logistics capture. Server remains authority for placement and group expansion. */
export function movementInput(v: Record<string, unknown>, rows: Record<string, string>[]) {
  const ids = new Set<string>();
  const roots: RootInput[] = rows.map((r) => {
    if (ids.has(r['assetUuid'])) throw new Error('No repitas una raíz.');
    ids.add(r['assetUuid']);
    if (r['grossWeightKg'] && !r['weightReference'].trim())
      throw new Error('El peso medido exige referencia.');
    if (v['type'] !== 'OUTBOUND' && v['type'] !== 'ADJUSTMENT' && !r['destinationLocationUuid'])
      throw new Error('Selecciona ubicación para cada raíz.');
    return {
      assetUuid: r['assetUuid'],
      destinationLocationUuid:
        v['type'] === 'OUTBOUND' ? null : r['destinationLocationUuid'] || null,
      destinationSiteUuid:
        v['type'] === 'OUTBOUND' ? String(v['destinationSiteUuid'] || '') || null : null,
      grossWeightKg: r['grossWeightKg'] || null,
      weightReference: r['weightReference'] || null,
      reservationUuid: r['reservationUuid'] || null,
    };
  });
  if (v['type'] === 'OUTBOUND' && (!v['destinationSiteUuid'] || !v['destinationCustodianUuid']))
    throw new Error('Selecciona sitio y custodio externos.');
  return {
    type: v['type'],
    roots,
    reason: v['reason'],
    sourceReference: v['sourceReference'],
    transitCustodianUuid: v['transitCustodianUuid'] || null,
    destinationCustodianUuid:
      v['type'] === 'OUTBOUND' ? v['destinationCustodianUuid'] || null : null,
    destinationCustodyMode: v['destinationCustodyMode'],
    ownerAuthorizationReference: v['ownerAuthorizationReference'] || null,
  };
}
