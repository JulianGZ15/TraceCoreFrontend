import { Page } from '@playwright/test';
import { fixtureApi, ids } from './api-fixture';
export const partyId = '00000000-0000-0000-0000-000000000010';
export async function partnersFixture(
  page: Page,
  permissions = ['PARTY_READ', 'PARTY_MANAGE', 'PARTY_APPROVE', 'AVL_MANAGE'],
) {
  const base = await fixtureApi(page);
  const state = {
    permissions,
    party: {
      uuid: partyId,
      legalName: 'Tercero de prueba',
      tradeName: 'Comercial de prueba',
      country: 'MX',
      active: true,
      version: 0,
    },
    lists: {} as Record<string, Record<string, unknown>[]>,
    requests: [] as {
      method: string;
      path: string;
      body: Record<string, unknown>;
      query: URLSearchParams;
      authorization: string | undefined;
    }[],
    conflict: false,
    uploadStatus: 201,
    eligibility: { allowed: false, reason: 'AVL_REQUIRED' },
    sequence: 20,
  };
  const nextId = () => '00000000-0000-0000-0000-' + String(++state.sequence).padStart(12, '0');
  state.lists['roles'] = [
    {
      uuid: nextId(),
      partyUuid: partyId,
      role: 'SUPPLIER',
      validFrom: '2020-01-01T00:00:00Z',
      validTo: null,
      revokedAt: null,
      version: 0,
    },
  ];
  for (const kind of [
    'contacts',
    'addresses',
    'tax-identities',
    'certifications',
    'evidence',
    'commercial-terms',
    'operation-authorizations',
    'avl-evaluations',
    'distribution-quotas',
  ])
    state.lists[kind] = [];
  await page.route('**/api/v1/auth/context', (route) =>
    route.fulfill({
      json: {
        company: {
          uuid: ids.company,
          name: base.company.name,
          timezone: 'UTC',
          active: base.company.active,
        },
        companyPermissions: base.company.active ? state.permissions : [],
        yards: [],
      },
    }),
  );
  await page.route('**/api/v1/parties**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.replace('/api/v1/parties', ''),
      method = request.method();
    let body: Record<string, unknown> = {};
    if ((request.headers()['content-type'] ?? '').includes('application/json'))
      body = request.postDataJSON() ?? {};
    state.requests.push({
      method,
      path,
      body,
      query: url.searchParams,
      authorization: request.headers()['authorization'],
    });
    const respond = (json: unknown, status = 200) => route.fulfill({ json, status });
    if (!path) {
      if (method === 'GET') {
        let rows = [state.party];
        const search = url.searchParams.get('search');
        if (
          search &&
          !state.party.legalName.toLowerCase().includes(search.toLowerCase()) &&
          !state.party.tradeName.toLowerCase().includes(search.toLowerCase())
        )
          rows = [];
        return respond(rows);
      }
      Object.assign(state.party, body);
      return respond(state.party, 201);
    }
    if (path === '/quota-yards')
      return respond([
        { uuid: ids.yard, code: 'PT-MTY', name: 'Patio Monterrey', timezone: 'UTC' },
      ]);
    const parts = path.slice(1).split('/');
    if (parts[0] !== partyId) return respond({ message: 'missing' }, 404);
    if (parts.length === 1) {
      if (method === 'GET') return respond(state.party);
      if (state.conflict) return respond({ message: 'version' }, 409);
      Object.assign(state.party, body, { version: state.party.version + 1 });
      return respond(state.party);
    }
    const kind = parts[1];
    if (kind === 'eligibility') return respond(state.eligibility);
    const list = state.lists[kind] ?? [];
    if (kind === 'evidence' && parts[3] === 'content')
      return route.fulfill({
        body: Buffer.from('%PDF-1.7\nfixture'),
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="prueba.pdf"',
          'Cache-Control': 'no-store',
        },
      });
    if (method === 'GET') {
      const filtered =
        kind === 'avl-evaluations' && url.searchParams.get('scope')
          ? list.filter((r) => r['scope'] === url.searchParams.get('scope'))
          : list;
      const offset = Number(url.searchParams.get('offset') ?? 0),
        limit = Number(url.searchParams.get('limit') ?? 100);
      return respond(filtered.slice(offset, offset + limit));
    }
    if (state.conflict) return respond({}, 409);
    if (kind === 'evidence') {
      if (state.uploadStatus !== 201) return respond({}, state.uploadStatus);
      const file = {
        uuid: nextId(),
        partyUuid: partyId,
        filename: 'prueba.pdf',
        mediaType: 'application/pdf',
        size: 20,
        sha256: 'a'.repeat(64),
        version: 0,
      };
      list.unshift(file);
      return respond(file, 201);
    }
    if (parts.length === 2) {
      const row = {
        ...body,
        uuid: nextId(),
        partyUuid: partyId,
        version: 0,
        validFrom: body['validFrom'] ?? '2026-01-01T00:00:00Z',
        validTo: body['validTo'] ?? null,
        revokedAt: null,
        verification: 'PENDING',
        verifiedBy: null,
        verifiedAt: null,
        approvedBy: ids.admin,
        approvedAt: '2026-01-01T00:00:00Z',
        revokedBy: null,
        evaluatedAt: '2026-01-01T00:00:00Z',
        evaluatorUuid: ids.admin,
        categoryUuid: null,
        modelUuid: null,
      };
      if (kind === 'commercial-terms')
        row['creditLimitExact' as keyof typeof row] = String(body['creditLimit']) as never;
      if (kind === 'contacts' && body['primary'])
        for (const existing of list)
          if (existing['primary'])
            Object.assign(existing, { primary: false, version: Number(existing['version']) + 1 });
      list.unshift(row);
      return respond(row, 201);
    }
    const row = list.find((r) => r['uuid'] === parts[2]);
    if (!row) return respond({}, 404);
    if (method === 'PUT') {
      Object.assign(row, body, { version: Number(row['version']) + 1 });
      if (['certifications', 'tax-identities'].includes(kind)) row['verification'] = 'PENDING';
      return respond(row);
    }
    if (parts[3] === 'revoke') {
      Object.assign(row, {
        revokedAt: '2026-01-01T00:00:00Z',
        version: Number(row['version']) + 1,
      });
      return respond(row);
    }
    if (parts[3] === 'review') {
      Object.assign(row, {
        verification: body['decision'],
        verifiedBy: ids.admin,
        verifiedAt: '2026-01-01T00:00:00Z',
        version: Number(row['version']) + 1,
      });
      return respond(row);
    }
    if (parts[3] === 'close') {
      Object.assign(row, { validTo: body['validTo'], version: Number(row['version']) + 1 });
      return respond(row);
    }
    return respond({}, 400);
  });
  return state;
}
