import { expect, test } from '@playwright/test';

const uuid = '00000000-0000-0000-0000-000000000100';

async function equipmentFixture(page: import('@playwright/test').Page) {
  const category = {
    uuid,
    version: 0,
    code: 'CAT-01',
    name: 'Categoría de prueba',
    parentUuid: null,
    technicalKind: 'GENERAL',
    active: true,
  };
  const user = { uuid, name: 'Equipo Prueba', email: 'equipment@example.test', active: true, version: 0 };
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const respond = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/auth/login')
      return respond({ accessToken: 'equipment-fixture', tokenType: 'Bearer', expiresAt: new Date(Date.now() + 900000).toISOString(), user });
    if (!request.headers()['authorization']) return respond({}, 401);
    if (path === '/auth/me') return respond(user);
    if (path === '/auth/context')
      return respond({ company: { uuid, name: 'TraceCore', timezone: 'UTC', active: true }, companyPermissions: ['EQUIPMENT_READ', 'EQUIPMENT_MANAGE', 'TECHNICAL_APPROVE', 'OWNERSHIP_MANAGE'], yards: [] });
    if (path === '/equipment/categories') return respond([category]);
    if (path === '/equipment/models') return respond([]);
    if (path === '/equipment/material-grades') return respond([]);
    if (path === '/equipment/heats') return respond([]);
    if (path === '/equipment/lots') return respond([]);
    if (path === '/equipment/assets') return respond([]);
    return respond({}, 404);
  });
}

test('catálogo técnico usa rutas lazy, permisos y tablas sin N+1', async ({ page }) => {
  await equipmentFixture(page);
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('equipment@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixtureOnly123!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.goto('/catalogo/categorias');
  await expect(page.getByRole('heading', { name: 'Categorías técnicas' })).toBeVisible();
  await expect(page.getByText('Categoría de prueba', { exact: true })).toBeVisible();
  await page.goto('/equipos');
  await expect(page.getByRole('heading', { name: 'Equipos' })).toBeVisible();
  await expect(page.getByText('No hay registros para estos criterios.', { exact: true })).toBeVisible();
});
