import { Page, expect } from '@playwright/test';
export const ids = {
  company: '00000000-0000-0000-0000-000000000001',
  admin: '00000000-0000-0000-0000-000000000002',
  user: '00000000-0000-0000-0000-000000000003',
  yard: '00000000-0000-0000-0000-000000000004',
  role: '00000000-0000-0000-0000-000000000005',
  permission: '00000000-0000-0000-0000-000000000006',
};
export async function fixtureApi(page: Page, profile: 'admin' | 'operator' | 'empty' = 'admin') {
  const company = {
    uuid: ids.company,
    legalName: 'TraceCore Operaciones, S.A. de C.V.',
    name: 'TraceCore Operaciones',
    country: 'MX',
    timezone: 'America/Mexico_City',
    active: true,
    version: 0,
  };
  const user = {
    uuid: ids.admin,
    name: 'Ana García',
    email: 'ana@example.test',
    active: true,
    version: 0,
  };
  const yards = [
    {
      uuid: ids.yard,
      companyUuid: ids.company,
      code: 'PT-MTY',
      name: 'Patio Monterrey',
      address: 'Av. Industrial 120, Monterrey',
      timezone: 'America/Monterrey',
      active: true,
      version: 0,
    },
  ];
  const users = [
    user,
    { ...user, uuid: ids.user, name: 'Diego López', email: 'diego@example.test' },
  ];
  const roles = [{ uuid: ids.role, code: 'OPERADOR', name: 'Operador de patio', version: 0 }];
  const permissions = [
    { uuid: ids.permission, code: 'YARD_READ' },
    { uuid: '00000000-0000-0000-0000-000000000007', code: 'YARD_MANAGE' },
  ];
  const state = {
    profile,
    company,
    yards,
    users,
    roles,
    permissions,
    links: [] as any[],
    assignments: [] as any[],
    companyConflict: false,
    deniedCompany: 0,
    expiresIn: 900000,
    requests: [] as {
      path: string;
      method: string;
      body: any;
      authorization: string | undefined;
    }[],
  };
  const context = () => ({
    company: {
      uuid: company.uuid,
      name: company.name,
      timezone: company.timezone,
      active: company.active,
    },
    companyPermissions:
      state.profile === 'admin'
        ? company.active
          ? [
              'ORGANIZATION_READ',
              'ORGANIZATION_MANAGE',
              'YARD_MANAGE',
              'ACCESS_MANAGE',
              'AUDIT_READ',
            ]
          : ['ORGANIZATION_READ', 'ORGANIZATION_MANAGE']
        : [],
    yards:
      state.profile === 'empty' || !company.active
        ? []
        : yards
            .filter((y) => state.profile === 'admin' || y.active)
            .map((y) => ({ ...y, permissions: state.profile === 'operator' ? ['YARD_READ'] : [] })),
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.replace('/api/v1', ''),
      method = request.method();
    const body = request.postData() ? request.postDataJSON() : null;
    state.requests.push({ path, method, body, authorization: request.headers()['authorization'] });
    const respond = (json: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
    if (path === '/auth/login')
      return body.email === 'bad@example.test'
        ? respond({}, 401)
        : respond({
            accessToken: 'fixture-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + state.expiresIn).toISOString(),
            user,
          });
    if (!request.headers()['authorization']) return respond({}, 401);
    if (path === '/auth/me') return respond(user);
    if (path === '/auth/context') return respond(context());
    if (path === '/auth/password') return route.fulfill({ status: 204 });
    if (path === '/company') {
      if (state.deniedCompany) return respond({}, state.deniedCompany);
      if (method === 'PUT') {
        if (state.companyConflict) {
          state.companyConflict = false;
          return respond({}, 409);
        }
        Object.assign(company, body, { version: company.version + 1 });
      }
      return respond(company);
    }
    function list(items: any[]) {
      const offset = Number(url.searchParams.get('offset') ?? 0),
        limit = Number(url.searchParams.get('limit') ?? 25);
      return items.slice(offset, offset + limit);
    }
    function create(items: any[]) {
      const created = { uuid: crypto.randomUUID(), ...body, active: true, version: 0 };
      items.push(created);
      return respond(created, 201);
    }
    if (path === '/yards') return method === 'POST' ? create(yards) : respond(list(yards));
    if (path.startsWith('/yards/')) {
      const yard = yards.find((y) => y.uuid === path.split('/')[2]);
      if (!yard) return respond({}, 404);
      if (method === 'PUT') Object.assign(yard, body, { version: yard.version + 1 });
      return respond(yard);
    }
    if (path === '/users') return method === 'POST' ? create(users) : respond(list(users));
    if (/\/users\/.+\/assignments$/.test(path)) {
      if (method === 'POST') return create(state.assignments);
      return respond(state.assignments);
    }
    if (path.startsWith('/assignments/') && path.endsWith('/revoke')) {
      Object.assign(
        state.assignments.find((a) => a.uuid === path.split('/')[2]),
        { revokedAt: new Date().toISOString() },
      );
      return route.fulfill({ status: 204 });
    }
    if (path.startsWith('/users/')) {
      const target = users.find((u) => u.uuid === path.split('/')[2]);
      if (!target) return respond({}, 404);
      Object.assign(target, body, { version: target.version + 1 });
      return respond(target);
    }
    if (path === '/roles') return method === 'POST' ? create(roles) : respond(list(roles));
    if (path === '/permissions') return respond(list(permissions));
    if (path.startsWith('/roles/') && path.includes('/permissions')) {
      if (method === 'POST')
        state.links.push({
          uuid: crypto.randomUUID(),
          roleUuid: ids.role,
          permissionUuid: body.permissionUuid,
        });
      if (method === 'DELETE') {
        state.links = state.links.filter((l) => l.permissionUuid !== path.split('/').at(-1));
        return route.fulfill({ status: 204 });
      }
      return respond(state.links);
    }
    if (path === '/audit')
      return respond([
        {
          uuid: crypto.randomUUID(),
          actorUuid: ids.admin,
          action: 'USER_CREATED',
          resourceType: 'APP_USER',
          resourceUuid: ids.user,
          occurredAt: '2026-10-03T15:00:00Z',
          recordedAt: '2026-10-03T15:00:00Z',
          correlationUuid: '00000000-0000-0000-0000-000000000008',
          changedFields: ['name', 'email'],
        },
      ]);
    return respond({ error: 'Unexpected fixture route' }, 404);
  });
  return state;
}
export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('ana@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixtureOnly123!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
}
export async function expectNoPageOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
}
