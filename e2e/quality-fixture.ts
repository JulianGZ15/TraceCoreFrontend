import { Page } from '@playwright/test';
import { fixtureApi, ids } from './api-fixture';
export const qids = {
  asset: '10000000-0000-4000-8000-000000000001',
  policy: '10000000-0000-4000-8000-000000000002',
  standard: '10000000-0000-4000-8000-000000000003',
  mtr: '10000000-0000-4000-8000-000000000004',
  evidence: '10000000-0000-4000-8000-000000000005',
  inspection: '10000000-0000-4000-8000-000000000006',
  order: '10000000-0000-4000-8000-000000000007',
  link: '10000000-0000-4000-8000-000000000008',
  task: '10000000-0000-4000-8000-000000000009',
};
export async function qualityFixture(
  page: Page,
  profile: 'manager' | 'yard' | 'reader' = 'manager',
) {
  const auth = await fixtureApi(page);
  const codes = [
    'QUALITY_READ',
    'QUALITY_MANAGE',
    'QUALITY_APPROVE',
    'INSPECTION_MANAGE',
    'MAINTENANCE_MANAGE',
    'QUALITY_RELEASE',
    'REPAIR_DISPATCH',
  ];
  const asset = {
    uuid: qids.asset,
    version: 0,
    internalCode: 'QUALITY-ROOT-01',
    serialNumber: 'SERIAL-01',
    lifecycle: 'REGISTERED',
    categoryUuid: ids.role,
    categoryCode: 'VALVES',
    modelUuid: ids.permission,
    modelCode: 'MODEL-A',
    sheetUuid: ids.role,
    sheetRevision: 'A',
    condition: 'SERVICEABLE',
    yardUuid: ids.yard,
    registeredAt: '2026-01-01T00:00:00Z',
  };
  const policy = {
    uuid: qids.policy,
    version: 0,
    modelUuid: asset.modelUuid,
    categoryUuid: null,
    standardUuid: qids.standard,
    revision: 'A',
    method: 'VISUAL',
    calendarDays: 365,
    hourInterval: 999999999999.999999,
    hourIntervalExact: '999999999999.999999',
    requireMtr: true,
    requireCertification: false,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: null,
    state: 'DRAFT',
    criteria: [
      {
        parameter: 'TEMPERATURE',
        unit: 'CELSIUS',
        minimum: -999999999999.999999,
        minimumExact: '-999999999999.999999',
        maximum: 999999999999.999999,
        maximumExact: '999999999999.999999',
      },
    ],
  };
  const mtr = {
    uuid: qids.mtr,
    version: 1,
    issuerUuid: ids.user,
    number: 'MTR-ORIGINAL-2026',
    certificateType: 'MTR',
    documentRevision: 'A',
    issuedAt: '2026-01-01T00:00:00Z',
    evidenceUuid: qids.evidence,
    state: 'DRAFT',
    reviewedAt: null,
    reviewReason: null,
    revokedAt: null,
  };
  const evidence = {
    uuid: qids.evidence,
    version: 0,
    fileName: 'Reporte técnico.pdf',
    mediaType: 'application/pdf',
    size: 10485760,
    sha256: 'a'.repeat(64),
    uploadedAt: '2026-01-01T00:00:00Z',
  };
  const inspection = {
    uuid: qids.inspection,
    version: 0,
    assetUuid: qids.asset,
    policyUuid: qids.policy,
    scheduledAt: '2026-10-05T10:00:00Z',
    inspectorUuid: ids.admin,
    facility: 'Taller manual',
    criteria: policy.criteria,
    state: 'PLANNED',
    performedAt: null,
    verdict: null,
    findings: null,
    evidenceUuid: null,
    baselineHours: null,
    baselineHoursExact: null,
    nextDueAt: null,
    nextDueHours: null,
    nextDueHoursExact: null,
    reviewReason: null,
  };
  const order = {
    uuid: qids.order,
    version: 1,
    assetUuid: qids.asset,
    kind: 'PREVENTIVE',
    reason: 'Control documentado',
    scheduledAt: '2026-10-05T10:00:00Z',
    responsibleUuid: ids.admin,
    workshopUuid: null,
    providerUuid: ids.user,
    state: 'PLANNED',
    startedAt: null,
    completedAt: null,
    evidenceUuid: null,
    completionReason: null,
  };
  const state = {
    asset,
    policy,
    mtr,
    evidence,
    inspection,
    order,
    conflict: false,
    loseResponse: false,
    missingExact: false,
    revoked: false,
    requests: [] as { path: string; body: any; key: string | undefined }[],
    links: [
      {
        uuid: qids.link,
        certificateUuid: qids.mtr,
        assetUuid: qids.asset,
        materialTraceUuid: null,
        version: 0,
        withdrawnAt: '2026-10-01T10:00:00Z',
        withdrawnBy: ids.admin,
        withdrawalReason: 'Destino incorrecto',
      },
    ],
    tasks: [
      {
        uuid: qids.task,
        version: 0,
        orderUuid: qids.order,
        code: 'SEAL',
        description: 'Revisar sello',
        requirements: 'Procedimiento aprobado',
        completedAt: null,
        evidenceUuid: null,
        completionReason: null,
      },
    ],
    receipt: null as any,
  };
  await page.route('**/api/v1/auth/context', (route) =>
    route.fulfill({
      json: {
        company: auth.company,
        companyPermissions: state.revoked
          ? []
          : profile === 'yard'
            ? []
            : profile === 'reader'
              ? ['QUALITY_READ']
              : codes,
        yards:
          profile === 'yard' && !state.revoked
            ? [
                {
                  ...auth.yards[0],
                  permissions: ['QUALITY_READ', 'INSPECTION_MANAGE', 'MAINTENANCE_MANAGE'],
                },
              ]
            : auth.yards.map((y) => ({ ...y, permissions: [] })),
      },
    }),
  );
  await page.route('**/api/v1/quality/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      p = url.pathname.replace('/api/v1/quality', '');
    const send = (json: any, status = 200) => route.fulfill({ json, status });
    if (req.method() === 'GET') {
      if (p === '/assets') return send([asset]);
      if (p.endsWith('/summary')) return send(asset);
      if (p.endsWith('/readiness'))
        return send([
          {
            assetUuid: qids.asset,
            technicallyReady: true,
            dispatchReleased: false,
            reasons: ['DISPATCH_RELEASE_MISSING_OR_STALE'],
            nextDueAt: null,
            nextDueHours: null,
            nextDueHoursExact: null,
            evaluatedAt: '2026-10-05T10:00:00Z',
          },
        ]);
      if (p.endsWith('/applicable-policies')) return send([{ ...policy, state: 'APPROVED' }]);
      if (p.endsWith('/mtr-coverage'))
        return send([
          {
            materialTraceUuid: qids.link,
            heatUuid: qids.standard,
            position: 'BODY',
            covered: true,
            certificateUuid: qids.mtr,
            number: mtr.number,
            linkType: 'HEAT',
          },
        ]);
      if (p.endsWith('/material-traces')) return send([]);
      if (p === '/standards' || p === '/standards/' + qids.standard)
        return send(
          p === '/standards'
            ? [
                {
                  uuid: qids.standard,
                  version: 0,
                  organization: 'TEST',
                  code: 'STD-TEST',
                  edition: 'A',
                  title: 'Controles manuales',
                  active: true,
                },
              ]
            : { uuid: qids.standard },
        );
      if (p === '/requirements') return send([]);
      if (p === '/policies') return send([policy]);
      if (p === '/policies/' + qids.policy)
        return send({
          ...policy,
          hourIntervalExact: state.missingExact ? undefined : policy.hourIntervalExact,
        });
      if (p === '/mtrs') return send([mtr]);
      if (p === '/mtrs/' + qids.mtr) return send(mtr);
      if (p.endsWith('/heats')) return send([]);
      if (p.endsWith('/assets')) return send(state.links);
      if (p === '/inspections')
        return send([
          { record: inspection, assetCode: asset.internalCode, serialNumber: asset.serialNumber },
        ]);
      if (p === '/inspections/' + qids.inspection) return send(inspection);
      if (p.endsWith('/measurements')) return send([]);
      if (p === '/maintenance')
        return send([
          { record: order, assetCode: asset.internalCode, serialNumber: asset.serialNumber },
        ]);
      if (p === '/maintenance/' + qids.order) return send(order);
      if (p.endsWith('/tasks')) return send(state.tasks);
      if (p === '/certifications' || p === '/holds' || p === '/releases') return send([]);
      if (p === '/evidence') return send([evidence]);
      if (p.endsWith('/content'))
        return route.fulfill({
          body: '%PDF-1.4\n%%EOF',
          headers: { 'content-type': 'application/pdf' },
        });
      if (p === '/evidence/' + qids.evidence) return send(evidence);
      if (p.endsWith('-options'))
        return send([
          {
            uuid: ids.user,
            label: url.searchParams.get('kind') === 'MODEL' ? 'MODEL-A' : 'Responsable documental',
            code: 'OPTION',
          },
        ]);
      if (p.startsWith('/requests/'))
        return state.receipt ? send(state.receipt) : send({ error: 'Not found' }, 404);
    }
    if (req.method() === 'POST' || req.method() === 'PUT') {
      const body = req.headers()['content-type']?.includes('json') ? req.postDataJSON() : {};
      const key = req.headers()['idempotency-key'];
      state.requests.push({ path: p, body, key });
      if (state.conflict) {
        state.conflict = false;
        return send({ error: 'Resource changed' }, 409);
      }
      if (p === '/policies/' + qids.policy) {
        Object.assign(policy, body, {
          hourIntervalExact: body.hourInterval,
          version: policy.version + 1,
        });
        return send(policy);
      }
      if (p === '/inspections') {
        state.receipt = {
          key,
          operation: 'INSPECTION',
          assetUuid: qids.asset,
          resourceUuid: qids.inspection,
          createdAt: '2026-10-05T10:00:00Z',
        };
        if (state.loseResponse) {
          state.loseResponse = false;
          return route.abort('failed');
        }
        return send(inspection, 201);
      }
      if (p === '/inspections/' + qids.inspection + '/record') {
        Object.assign(inspection, body, { state: 'RECORDED', version: 1 });
        return send(inspection);
      }
      if (p === '/mtrs/' + qids.mtr) {
        Object.assign(mtr, body, { version: mtr.version + 1 });
        return send(mtr);
      }
      return send({ uuid: qids.link, version: 1 }, 201);
    }
    return send({ error: 'Unexpected quality fixture route ' + p }, 404);
  });
  return state;
}
