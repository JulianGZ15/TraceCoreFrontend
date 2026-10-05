import { Page } from '@playwright/test';
import { fixtureApi, ids } from './api-fixture';
export const cids = {
  order: '70000000-0000-4000-8000-000000000001',
  line: '70000000-0000-4000-8000-000000000002',
  rental: '70000000-0000-4000-8000-000000000003',
  assignment: '70000000-0000-4000-8000-000000000004',
  billing: '70000000-0000-4000-8000-000000000005',
  party: '70000000-0000-4000-8000-000000000006',
  model: '70000000-0000-4000-8000-000000000007',
  site: '70000000-0000-4000-8000-000000000008',
};
export async function commerceFixture(
  page: Page,
  profile: 'manager' | 'reader' | 'yard' | 'write-only' = 'manager',
) {
  const auth = await fixtureApi(page);
  const codes = [
    'COMMERCIAL_READ',
    'COMMERCIAL_MANAGE',
    'COMMERCIAL_APPROVE',
    'COMMERCIAL_FULFILL',
    'RENTAL_MANAGE',
    'RENTAL_BILL',
    'CONTRACT_MANAGE',
    'RESERVATION_MANAGE',
    'OWNERSHIP_MANAGE',
  ];
  const order: any = {
    uuid: cids.order,
    version: 1,
    type: 'OR',
    state: 'DRAFT',
    series: 'MAIN',
    folio: 'RENTA-001',
    partyUuid: cids.party,
    yardUuid: ids.yard,
    currency: 'MXN',
    orderedAt: '2026-10-01T12:00:00Z',
    avlScope: 'GENERAL',
    termsUuid: null,
    termsReference: 'Contrato revisado',
    snapshot: null,
  };
  const rental: any = {
    uuid: cids.rental,
    version: 0,
    orderUuid: cids.order,
    state: 'DRAFT',
    contractingPartyUuid: cids.party,
    distributorUuid: null,
    endCustomerUuid: cids.party,
    payerUuid: cids.party,
    siteUuid: cids.site,
    frameworkUuid: null,
    plannedFrom: '2026-10-01T12:00:00Z',
    plannedTo: '2026-10-31T12:00:00Z',
    timezone: 'America/Mexico_City',
    responsibilities: 'Custodia contractual',
  };
  const line: any = {
    uuid: cids.line,
    version: 0,
    orderUuid: cids.order,
    lineNumber: 1,
    kind: 'EQUIPMENT',
    modelUuid: cids.model,
    concept: 'Equipo contratado con descripción larga de revisión',
    quantityExact: '1',
    unit: 'PIECE',
    unitPriceExact: '99999999999999.9999',
    discountFractionExact: '0',
    taxFractionExact: '0',
    netAmountExact: '99999999999999.9999',
    taxAmountExact: '0.0000',
    totalAmountExact: '99999999999999.9999',
  };
  const assignment: any = {
    uuid: cids.assignment,
    version: 0,
    agreementUuid: cids.rental,
    lineUuid: cids.line,
    rootAssetUuid: ids.role,
    assetUuid: ids.role,
    state: 'ACTIVE',
    actualFrom: '2026-10-01T12:00:00Z',
    actualTo: null,
  };
  const state = {
    order,
    rental,
    line,
    conflict: false,
    loseResponse: false,
    previewConflict: false,
    creates: [] as any[],
    writes: [] as any[],
  };
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      p = url.pathname.replace('/api/v1', ''),
      method = req.method();
    const body = req.postDataJSON();
    const answer = (v: any, status = 200) => route.fulfill({ status, json: v });
    if (p === '/auth/context')
      return answer({
        company: auth.company,
        companyPermissions:
          profile === 'yard'
            ? []
            : profile === 'reader'
              ? ['COMMERCIAL_READ']
              : profile === 'write-only'
                ? ['COMMERCIAL_MANAGE']
                : codes,
        yards: auth.yards.map((y) => ({
          ...y,
          permissions: profile === 'yard' ? ['COMMERCIAL_READ', 'COMMERCIAL_MANAGE'] : [],
        })),
      });
    if (!p.startsWith('/commercial')) return route.fallback();
    const path = p.slice('/commercial'.length);
    if (method === 'GET') {
      if (path === '/orders/directory')
        return answer([{ record: order, label: 'Cliente industrial' }]);
      if (path === '/orders/' + cids.order + '/summary')
        return answer({ order, purchase: null, sale: null, rental, nextLineNumber: 2 });
      if (path.endsWith('/approval-check')) return answer(['FINANCIAL_COMMITMENT_REQUIRED']);
      if (path === '/orders/' + cids.order + '/lines')
        return answer([{ record: line, label: line.concept }]);
      if (path === '/rentals') return answer([{ record: rental, label: 'Cliente industrial' }]);
      if (path === '/rentals/' + cids.rental) return answer(rental);
      if (path === '/assignments/' + cids.assignment) return answer(assignment);
      if (path === '/lines/' + cids.line) return answer(line);
      if (path === '/requests/' + order.uuid) return answer({ order });
      if (path === '/billings/' + cids.billing)
        return answer({
          uuid: cids.billing,
          version: 0,
          assignmentUuid: cids.assignment,
          periodFrom: assignment.actualFrom,
          periodTo: '2026-10-02T12:00:00Z',
          totalAmountExact: '1234.5678',
          currency: 'MXN',
          slices: [],
        });
      if (path.endsWith('-options'))
        return answer([
          {
            uuid:
              path === '/model-options'
                ? cids.model
                : path === '/site-options'
                  ? cids.site
                  : cids.party,
            label:
              path === '/model-options'
                ? 'Modelo industrial'
                : path === '/site-options'
                  ? 'Sitio externo'
                  : 'Cliente industrial',
          },
        ]);
      return answer([]);
    }
    state.writes.push({ method, path, body });
    if (method === 'PUT' && path.startsWith('/lines/')) {
      if (state.conflict) return answer({ code: 'VERSION_CONFLICT' }, 409);
      Object.assign(line, body.line, { version: line.version + 1 });
      order.version++;
      return answer(line);
    }
    if (path === '/orders') {
      state.creates.push(body);
      Object.assign(order, body, { state: 'DRAFT', version: 0 });
      if (state.loseResponse) return route.abort('failed');
      return answer(order);
    }
    if (path === '/billings/preview')
      return answer({
        assignmentUuid: cids.assignment,
        ...body,
        slices: [
          {
            mode: 'ACTIVE',
            amountExact: '1234.5678',
            unitsExact: '24',
            rateAmountExact: '51.4403',
            timeUnit: 'HOUR',
            rounding: 'PROPORTIONAL',
          },
        ],
        totalAmountExact: '1234.5678',
        currency: 'MXN',
        calculationFingerprint: 'preview-fingerprint',
      });
    if (path === '/billings') {
      if (state.previewConflict) return answer({ code: 'CALCULATION_CHANGED' }, 409);
      return answer({ uuid: cids.billing, version: 0 });
    }
    return answer(order);
  });
  return state;
}
