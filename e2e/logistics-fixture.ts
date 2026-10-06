import { Page } from '@playwright/test';
import { fixtureApi, ids } from './api-fixture';
export const lids = {
  manifest: '80000000-0000-4000-8000-000000000001',
  trip: '80000000-0000-4000-8000-000000000002',
  vehicle: '80000000-0000-4000-8000-000000000003',
  driver: '80000000-0000-4000-8000-000000000004',
  carrier: '80000000-0000-4000-8000-000000000005',
  site: '80000000-0000-4000-8000-000000000006',
  root: '80000000-0000-4000-8000-000000000007',
  child: '80000000-0000-4000-8000-000000000008',
  other: '80000000-0000-4000-8000-000000000009',
  check: '80000000-0000-4000-8000-000000000010',
  evidence: '80000000-0000-4000-8000-000000000011',
  receipt: '80000000-0000-4000-8000-000000000012',
  session: '80000000-0000-4000-8000-000000000013',
};
export async function logisticsFixture(
  page: Page,
  profile: 'manager' | 'reader' | 'receiver' | 'yard' = 'manager',
) {
  const auth = await fixtureApi(page);
  const codes = [
    'LOGISTICS_READ',
    'LOGISTICS_MANAGE',
    'LOGISTICS_CHECK',
    'LOGISTICS_DISPATCH',
    'LOGISTICS_RECEIVE',
    'INVENTORY_READ',
    'MOVEMENT_MANAGE',
    'DISPATCH_APPROVE',
  ];
  const manifest: any = {
    uuid: lids.manifest,
    version: 2,
    folio: 'MAN-0001 · carga de conjuntos completa',
    yardUuid: ids.yard,
    sourceYardUuid: ids.yard,
    destinationSiteUuid: lids.site,
    state: 'DRAFT',
    type: 'OUTBOUND',
    dispatchCheckUuid: lids.check,
  };
  const trip: any = {
    uuid: lids.trip,
    manifestUuid: lids.manifest,
    carrierUuid: lids.carrier,
    vehicleUuid: lids.vehicle,
    driverUuid: lids.driver,
    version: 0,
    state: 'PLANNED',
    plannedDeparture: new Date(Date.now() + 60000).toISOString(),
    eta: new Date(Date.now() + 3600000).toISOString(),
  };
  const items = [lids.root, lids.child, lids.other].map((id, i) => ({
    record: {
      uuid: '80000000-0000-4000-8000-00000000002' + i,
      version: 0,
      assetUuid: id,
      rootAssetUuid: i === 2 ? lids.other : lids.root,
      movementUuid: lids.trip,
      grossWeightKgExact: i === 1 ? null : '999999999999.999999',
    },
    label:
      i === 1 ? 'Componente válvula con marcación larga' : 'Raíz completa ' + (i === 2 ? 'B' : 'A'),
  }));
  const check: any = {
    uuid: lids.check,
    manifestUuid: lids.manifest,
    version: 0,
    method: 'MANUAL',
    reference: 'Registro comprobado',
    checkedAt: new Date().toISOString(),
    approved: true,
    expected: items.map((x) => x.record.assetUuid),
    observed: items.map((x) => x.record.assetUuid),
    missing: [],
    extra: [],
    unresolvedEvents: [],
  };
  const evidence = {
    uuid: lids.evidence,
    manifestUuid: lids.manifest,
    version: 0,
    filename: 'evidencia-entrega-autorizada.pdf',
    mediaType: 'application/pdf',
    size: 1200,
    sha256: 'a'.repeat(64),
  };
  const state = {
    auth,
    manifest,
    trip,
    items,
    check,
    conflict: false,
    writes: [] as { method: string; path: string; body: any }[],
    received: [] as string[],
    events: [lids.root, lids.child, lids.other],
    loseResponse: false,
  };
  const summary = () => ({
    manifest,
    trip,
    labels: {
      origin: 'Patio Monterrey',
      destination: 'Sitio externo de recepción',
      carrier: 'Transportista autorizado',
      vehicle: 'TR-001',
      driver: 'Operador transporte',
    },
    rootCount: 2,
    pieceCount: 3,
    deliveredRootCount: state.received.length,
    totalWeightKgExact: '1999999999999.999998',
    unknownWeightRoots: 0,
    carrierUuid: lids.carrier,
  });
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      u = new URL(req.url()),
      p = u.pathname.replace('/api/v1', ''),
      method = req.method(),
      body = method === 'GET' ? null : req.postDataJSON?.();
    const answer = (v: unknown, status = 200) => route.fulfill({ status, json: v });
    if (p === '/auth/context')
      return answer({
        company: {
          uuid: ids.company,
          name: 'TraceCore',
          active: true,
          timezone: 'America/Mexico_City',
        },
        companyPermissions:
          profile === 'yard'
            ? []
            : profile === 'manager'
              ? codes
              : profile === 'receiver'
                ? ['LOGISTICS_READ', 'LOGISTICS_RECEIVE', 'MOVEMENT_MANAGE']
                : ['LOGISTICS_READ'],
        yards: auth.yards.map((y) => ({ ...y, permissions: profile === 'yard' ? codes : [] })),
      });
    if (p === '/inventory/assets')
      return answer([
        {
          uuid: lids.root,
          internalCode: 'EQ-RAIZ-A',
          lifecycle: 'ACTIVE',
          placementState: 'IN_YARD',
        },
      ]);
    if (p === '/inventory/reservations') return answer([]);
    if (!p.startsWith('/logistics')) return route.fallback();
    const path = p.slice('/logistics'.length);
    if (method === 'GET') {
      if (path === '/manifests/directory')
        return answer([{ record: manifest, label: 'Destino y transportista autorizados' }]);
      if (path.endsWith('/summary')) return answer(summary());
      if (path.endsWith('/trip')) return answer(trip);
      if (path.endsWith('/trip/revisions')) return answer([]);
      if (path.endsWith('/verification-context'))
        return answer({
          expected: items.map((x) => x.record.assetUuid),
          eventUuids: state.events,
          sessionUuid: u.searchParams.get('sessionUuid'),
          receiptCount: state.events.length,
        });
      if (path.endsWith('/items') && path.startsWith('/manifests/')) {
        let rows = items;
        if (u.searchParams.get('rootsOnly') === 'true')
          rows = rows.filter((x) => x.record.rootAssetUuid === x.record.assetUuid);
        if (u.searchParams.get('rootAssetUuid'))
          rows = rows.filter((x) => x.record.rootAssetUuid === u.searchParams.get('rootAssetUuid'));
        if (u.searchParams.get('pendingOnly') === 'true')
          rows = rows.filter((x) => !state.received.includes(x.record.rootAssetUuid));
        return answer(rows);
      }
      if (path === '/checks/' + lids.check) return answer(check);
      if (path.endsWith('/checks')) return answer([{ record: check, label: 'Manual aprobada' }]);
      if (path.endsWith('/evidence'))
        return answer([{ record: evidence, label: evidence.filename }]);
      if (path.startsWith('/requests/')) return answer(manifest);
      if (path.endsWith('/content'))
        return route.fulfill({ body: '%PDF-1.4\n%%EOF', contentType: 'application/pdf' });
      if (path === '/receipts/' + lids.receipt)
        return answer({
          uuid: lids.receipt,
          manifestUuid: lids.manifest,
          reference: 'Entrega raíz completa',
          receiverName: 'Receptor',
          evidenceUuid: lids.evidence,
          receivedAt: new Date().toISOString(),
        });
      if (path.endsWith('-options'))
        return answer([
          {
            uuid:
              path === '/transport-options'
                ? u.searchParams.get('kind') === 'DRIVER'
                  ? lids.driver
                  : lids.vehicle
                : path === '/site-options'
                  ? lids.site
                  : lids.carrier,
            label:
              path === '/transport-options'
                ? u.searchParams.get('kind') === 'DRIVER'
                  ? 'Operador transporte'
                  : 'TR-001'
                : 'Transportista autorizado',
          },
        ]);
      return answer([]);
    }
    state.writes.push({ method, path, body });
    if (state.conflict) return answer({ code: 'VERSION_CONFLICT', message: 'Trip changed' }, 409);
    if (method === 'PUT' && path.endsWith('/trip')) {
      Object.assign(trip, body, { version: trip.version + 1 });
      manifest.version++;
      manifest.state = 'DRAFT';
      manifest.dispatchCheckUuid = null;
      return answer(trip);
    }
    if (path.endsWith('/checks')) {
      Object.assign(check, body, { uuid: lids.check, checkedAt: new Date().toISOString() });
      manifest.state = 'CHECKED';
      manifest.version++;
      return answer(check);
    }
    if (path.endsWith('/receipts')) {
      state.received.push(...body.roots.map((r: any) => r.rootAssetUuid));
      manifest.version++;
      manifest.state = state.received.length === 2 ? 'DELIVERED' : 'PARTIALLY_DELIVERED';
      return answer({ uuid: lids.receipt, manifestUuid: lids.manifest });
    }
    if (path.endsWith('/dispatch')) {
      manifest.state = 'IN_TRANSIT';
      manifest.version++;
      return answer(summary());
    }
    return answer(evidence);
  });
  return state;
}
