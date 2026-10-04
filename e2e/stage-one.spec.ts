import { test, expect } from '@playwright/test';
import { fixtureApi, login, ids, expectNoPageOverflow } from './api-fixture';

test('login errors, authorized return, reload and local logout', async ({ page }) => {
  const state = await fixtureApi(page);
  await page.goto('/acceso/usuarios');
  await expect(page).toHaveURL(/login\?returnUrl/);
  await page.getByLabel('Correo electrónico', { exact: true }).fill('bad@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos iniciar sesión');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('ana@example.test');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
  expect(
    state.requests.filter((r) => r.path === '/auth/login').every((r) => !r.authorization),
  ).toBe(true);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem('tracecore.session'))).toBeNull();
});
test('unassigned user keeps account access', async ({ page }) => {
  await fixtureApi(page, 'empty');
  await login(page);
  await expect(page).toHaveURL(/sin-acceso/);
  await page.getByRole('link', { name: 'Mi cuenta', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Tu perfil', exact: true })).toBeVisible();
  await expect(page.getByText('ana@example.test', { exact: true })).toBeVisible();
});
test('operator sees only an authorized yard and cannot access administration', async ({ page }) => {
  await fixtureApi(page, 'operator');
  await login(page);
  await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
  await page.getByRole('link', { name: /PT-MTY/ }).click();
  await expect(page.getByRole('heading', { name: 'Información del patio' })).toBeVisible();
  await expect(page.getByLabel('Nombre', { exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0);
  await page.goto('/acceso/usuarios');
  await expect(page).toHaveURL(/sin-acceso/);
});
test('revocation refreshes capabilities on navigation', async ({ page }) => {
  const state = await fixtureApi(page);
  await login(page);
  await expect(page).toHaveURL(/inicio/);
  state.profile = 'empty';
  await page.getByRole('link', { name: 'Usuarios', exact: true }).click();
  await expect(page).toHaveURL(/sin-acceso/);
  await expect(page.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
});
test('inactive company retains only company management', async ({ page }) => {
  const state = await fixtureApi(page);
  state.company.active = false;
  await login(page);
  await expect(page.getByText('La empresa está inactiva.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Empresa', exact: true }).click();
  await expect(page.getByLabel('Empresa activa')).not.toBeChecked();
});
test('inactive yard is discoverable by admin but hidden from operator', async ({ page }) => {
  const state = await fixtureApi(page);
  state.yards[0].active = false;
  await login(page);
  await expect(page.getByRole('link', { name: /PT-MTY/ })).toContainText('Inactivo');
  state.profile = 'operator';
  await page.reload();
  await expect(page).toHaveURL(/sin-acceso/);
});
test('409 preserves draft and version, explicit reload replaces it', async ({ page }) => {
  const state = await fixtureApi(page);
  await login(page);
  await page.goto('/organizacion/empresa');
  await page.getByLabel('Nombre de la empresa').fill('Nombre pendiente');
  state.companyConflict = true;
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('alert')).toContainText('conflicto');
  await expect(page.getByLabel('Nombre de la empresa')).toHaveValue('Nombre pendiente');
  expect(state.requests.find((r) => r.method === 'PUT')?.body.version).toBe(0);
  await page.getByRole('button', { name: 'Recargar datos' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByLabel('Nombre de la empresa')).toHaveValue('TraceCore Operaciones');
  await page.getByLabel('Nombre de la empresa').fill('TraceCore Norte');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Información actualizada.')).toBeVisible();
});
test('new user has no roles and assignment uses an explicit UTC offset', async ({ page }) => {
  const state = await fixtureApi(page);
  await login(page);
  await page.goto('/acceso/usuarios');
  await page.getByRole('button', { name: /Nuevo usuario/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre completo').fill('María Torres');
  await dialog.getByLabel('Correo electrónico').fill('maria@example.test');
  await dialog.getByLabel('Contraseña inicial').fill('FixtureOnly123!');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('El usuario fue creado sin roles.', { exact: false })).toBeVisible();
  await page
    .getByRole('row')
    .filter({ hasText: 'Diego López' })
    .getByRole('button', { name: 'Asignaciones' })
    .click();
  await page.getByLabel('Rol', { exact: true }).selectOption(ids.role);
  await page.getByLabel('Alcance', { exact: true }).selectOption('YARD');
  await page.getByLabel('UUID del patio').fill(ids.yard);
  await page.getByLabel('Inicio (opcional)').fill('2027-01-01T09:00');
  await page.getByLabel('Desplazamiento UTC de estas fechas').fill('-06:00');
  await page.getByRole('button', { name: 'Asignar rol', exact: true }).click();
  await expect(page.getByText('Rol asignado.', { exact: true })).toBeVisible();
  expect(
    state.requests.find((r) => r.path.endsWith('/assignments') && r.method === 'POST')?.body,
  ).toMatchObject({
    companyUuid: ids.company,
    yardUuid: ids.yard,
    scopeType: 'YARD',
    validFrom: '2027-01-01T15:00:00.000Z',
  });
});
test('roles grant and remove permission links by permission UUID', async ({ page }) => {
  const state = await fixtureApi(page);
  await login(page);
  await page.goto('/acceso/roles');
  await page.getByRole('button', { name: 'Gestionar permisos', exact: true }).click();
  await page.getByLabel('Agregar capacidad').selectOption(ids.permission);
  await page.getByRole('button', { name: 'Agregar permiso' }).click();
  await expect(page.getByText('Permiso agregado.')).toBeVisible();
  await page.getByRole('button', { name: 'Retirar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Permiso retirado.')).toBeVisible();
  expect(state.requests.find((r) => r.method === 'DELETE')?.path).toBe(
    '/roles/' + ids.role + '/permissions/' + ids.permission,
  );
});
test('password change requires new login and clears storage', async ({ page }) => {
  await fixtureApi(page);
  await login(page);
  await page.goto('/mi-cuenta');
  await page.getByLabel('Contraseña actual').fill('FixtureOnly123!');
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('ChangedFixture123!');
  await page.getByLabel('Confirmar nueva contraseña').fill('ChangedFixture123!');
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
  await expect(page).toHaveURL(/login/);
  await expect(page.getByText('Contraseña actualizada. Inicia sesión de nuevo.')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('tracecore.session'))).toBeNull();
});
test('protected 401 logs out; a 403 preserves the session', async ({ page }) => {
  const state = await fixtureApi(page);
  await login(page);
  state.deniedCompany = 403;
  await page.goto('/organizacion/empresa');
  await expect(page.getByRole('alert')).toContainText('No tienes permiso');
  expect(await page.evaluate(() => sessionStorage.getItem('tracecore.session'))).not.toBeNull();
  state.deniedCompany = 401;
  await page.getByRole('button', { name: 'Volver a consultar' }).click();
  await expect(page).toHaveURL(/login/);
});
test('expiration closes an open protected drawer', async ({ page }) => {
  const state = await fixtureApi(page);
  state.expiresIn = 3500;
  await login(page);
  await page.goto('/acceso/usuarios');
  await page.getByRole('button', { name: 'Asignaciones' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(/login/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('mobile navigation closes on Escape and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixtureApi(page);
  await login(page);
  const button = page.getByRole('button', { name: 'Abrir navegación' });
  await button.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(button).toBeFocused();
  await expectNoPageOverflow(page);
});
test('audit exposes correlation and changed field names, and unknown routes are handled', async ({
  page,
}) => {
  await fixtureApi(page);
  await login(page);
  await page.goto('/auditoria');
  await page.getByRole('button', { name: 'Ver evento' }).click();
  await expect(page.getByRole('dialog')).toContainText('00000000-0000-0000-0000-000000000008');
  await expect(page.getByRole('dialog')).toContainText('Campos intervenidos');
  await page.keyboard.press('Escape');
  await page.goto('/missing');
  await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
});

test('assignment history remains scrollable at mobile height', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await fixtureApi(page);
  state.assignments.push({
    uuid: '00000000-0000-0000-0000-000000000010',
    userUuid: ids.user,
    roleUuid: ids.role,
    scopeType: 'YARD',
    companyUuid: ids.company,
    yardUuid: ids.yard,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: null,
    revokedAt: null,
    version: 0,
  });
  await login(page);
  await page.goto('/acceso/usuarios');
  await page
    .getByRole('row')
    .filter({ hasText: 'Diego López' })
    .getByRole('button', { name: 'Asignaciones' })
    .click();
  await page.getByRole('button', { name: 'Revocar asignación' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Asignación revocada.')).toBeVisible();
  await expectNoPageOverflow(page);
});

for (const width of [390, 768, 1280, 1440])
  test(`visual layouts at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await fixtureApi(page);
    await page.goto('/login');
    async function capture(name: string) {
      await page.mouse.move(0, 0);
      await page.evaluate(() => document.fonts.ready);
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: info.outputPath(name + '.png'),
        fullPage: true,
        animations: 'disabled',
      });
    }
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'TraceCore' })).toBeVisible();
    await capture('login');
    await login(page);
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    await capture('inicio');
    await page.goto('/acceso/usuarios');
    await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
    await capture('listado');
    await page.getByRole('button', { name: /Nuevo usuario/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await capture('dialogo');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.goto('/organizacion/empresa');
    await expect(page.getByLabel('Nombre de la empresa')).toHaveValue('TraceCore Operaciones');
    await capture('formulario');
  });
