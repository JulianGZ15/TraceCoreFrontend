import { test, expect } from '@playwright/test';
import { login, expectNoPageOverflow } from './api-fixture';
import { partnersFixture, partyId } from './partners-fixture';
test('directory filters use only supported fields, no N+1; initial creation opens dossier', async ({
  page,
}) => {
  const state = await partnersFixture(page);
  await login(page);
  await page.goto('/terceros');
  await expect(page.getByText('Tercero de prueba', { exact: true })).toBeVisible();
  expect(state.requests.some((r) => r.path.includes(partyId))).toBe(false);
  await page.getByRole('searchbox', { name: 'Buscar terceros' }).fill('Comercial');
  await page.getByRole('searchbox', { name: 'Buscar terceros' }).press('Enter');
  await page.getByRole('button', { name: 'Filtros' }).click();
  const filterDrawer = page.getByRole('dialog', { name: 'Filtros de terceros' });
  await filterDrawer.getByLabel('Rol vigente').selectOption('SUPPLIER');
  await filterDrawer.getByRole('button', { name: 'Activos', exact: true }).click();
  await filterDrawer.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).toHaveURL(/role=SUPPLIER/);
  await page.getByRole('button', { name: '+ Nuevo tercero' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Razón social', { exact: false }).fill('Empresa creada');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(partyId + '/general'));
  await expect(page.getByRole('heading', { name: 'Empresa creada', exact: true })).toBeVisible();
});
test('read-only access, missing read, yard-only permission, revocation and internal return', async ({
  page,
}) => {
  const state = await partnersFixture(page, ['PARTY_READ']);
  await page.goto('/terceros/' + partyId + '/general');
  await expect(page).toHaveURL(/login\?returnUrl/);
  await page.getByLabel('Correo electrónico', { exact: true }).fill('ana@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixtureOnly123!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(partyId + '/general'));
  await expect(page.getByLabel('Razón social', { exact: false })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0);
  state.permissions = ['PARTY_APPROVE'];
  await page.goto('/inicio');
  await expect(page.getByText('necesitas PARTY_READ', { exact: false })).toBeVisible();
  await page.goto('/terceros');
  await expect(page).toHaveURL(/sin-acceso/);
  state.permissions = ['PARTY_READ'];
  await page.goto('/terceros');
  await expect(page.getByRole('heading', { name: 'Directorio de terceros' })).toBeVisible();
  state.permissions = ['YARD_READ'];
  await page.getByRole('link', { name: 'Abrir expediente' }).click();
  await expect(page).toHaveURL(/sin-acceso/);
});
test('party and contact conflicts preserve drafts, reload explicitly and send versions', async ({
  page,
}) => {
  const state = await partnersFixture(page);
  await login(page);
  await page.goto('/terceros/' + partyId + '/general');
  await page.getByLabel('Razón social', { exact: false }).fill('Borrador conservado');
  state.conflict = true;
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('alert')).toContainText('conflicto');
  await expect(page.getByLabel('Razón social', { exact: false })).toHaveValue(
    'Borrador conservado',
  );
  await page.getByRole('button', { name: 'Recargar datos' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByLabel('Razón social', { exact: false })).toHaveValue('Tercero de prueba');
  state.conflict = false;
  await page.getByRole('link', { name: 'Contactos', exact: true }).click();
  await page.getByRole('button', { name: '+ Nuevo registro' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre completo').fill('Persona de enlace');
  await dialog.getByLabel('Extensión').fill('10');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('correo');
  await dialog.getByLabel('Teléfono').fill('+52551234');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Persona de enlace', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar contacto' }).click();
  await page.getByLabel('Cargo').fill('Cargo nuevo');
  state.conflict = true;
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByLabel('Cargo')).toHaveValue('Cargo nuevo');
  state.conflict = false;
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Cargo nuevo', { exact: true })).toBeVisible();
});
test('dirty route confirmation and session logout do not leak drafts', async ({ page }) => {
  await partnersFixture(page);
  await login(page);
  await page.goto('/terceros/' + partyId + '/general');
  await page.getByLabel('Razón social', { exact: false }).fill('Sin guardar');
  await page.getByRole('link', { name: 'Roles', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL(/general/);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/login/);
});
test('documents require evidence for review and verified records require revocation before correction', async ({
  page,
}) => {
  const state = await partnersFixture(page);
  await login(page);
  await page.goto('/terceros/' + partyId + '/fiscal');
  await page.getByRole('button', { name: '+ Nuevo registro' }).click();
  await page.getByLabel('Tipo de identificación').fill('RFC');
  await page.getByLabel('Número fiscal').fill('abc-123.456');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('ABC123456', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verificado', exact: true })).toBeDisabled();
  state.lists['evidence'] = [
    {
      uuid: '00000000-0000-0000-0000-000000000099',
      partyUuid: partyId,
      filename: 'prueba.pdf',
      size: 20,
      sha256: 'a'.repeat(64),
      mediaType: 'application/pdf',
      version: 0,
    },
  ];
  await page.getByRole('button', { name: 'Editar identificación' }).click();
  await page
    .getByLabel('Archivo de evidencia')
    .selectOption('00000000-0000-0000-0000-000000000099');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('button', { name: 'Verificado', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Editar identificación' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Revocado', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Editar identificación' })).toBeVisible();
});
test('file upload validates size, preserves selection on storage failure and downloads with bearer', async ({
  page,
}) => {
  const state = await partnersFixture(page);
  await login(page);
  await page.goto('/terceros/' + partyId + '/evidencias');
  await page.getByLabel('Archivo PDF').setInputFiles({
    name: 'prueba.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(10485761),
  });
  await page.getByRole('button', { name: 'Cargar archivo' }).click();
  await expect(page.getByRole('alert')).toContainText('10 MiB');
  state.uploadStatus = 503;
  await page.getByLabel('Archivo PDF').setInputFiles({
    name: 'prueba.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7\nfixture'),
  });
  await page.getByRole('button', { name: 'Cargar archivo' }).click();
  await expect(page.getByRole('alert')).toContainText('almacenamiento');
  await expect(page.getByRole('button', { name: 'Cargar archivo' })).toBeEnabled();
  state.uploadStatus = 201;
  await page.getByRole('button', { name: 'Cargar archivo' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'prueba.pdf' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar evidencia' }).click();
  expect((await download).suggestedFilename()).toBe('prueba.pdf');
  expect(state.requests.find((r) => r.path.endsWith('/content'))?.authorization).toContain(
    'Bearer',
  );
});
test('exact commercial credit and manual AVL are separate from eligibility', async ({ page }) => {
  const state = await partnersFixture(page);
  await login(page);
  await page.goto('/terceros/' + partyId + '/condiciones');
  await page.getByRole('button', { name: '+ Nuevo registro' }).click();
  await page.getByLabel('Divisa ISO').fill('USD');
  await page.getByLabel('Código de método de pago').fill('WIRE');
  await page.getByLabel('Código de condición de pago').fill('NET_30');
  await page.getByLabel('Límite de crédito').fill('999999999999999.9999');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(
    page.getByRole('cell').filter({ hasText: '999,999,999,999,999.9999 USD' }),
  ).toBeVisible();
  expect(
    state.requests.find((r) => r.method === 'POST' && r.path.endsWith('/commercial-terms'))?.body[
      'creditLimit'
    ],
  ).toBe('999999999999999.9999');
  await page.getByRole('link', { name: 'AVL', exact: true }).click();
  await page.getByRole('button', { name: '+ Nueva evaluación' }).click();
  await page.getByLabel('Alcance AVL').fill('API_6A');
  await page.getByLabel('Score', { exact: false }).fill('100');
  await page.getByLabel('Clasificación declarada').fill('TIER_1');
  await page.getByLabel('Dictamen').selectOption('REJECTED');
  await page.getByLabel('Próxima revisión').fill('2030-01-01T00:00');
  await page.getByLabel('Hallazgos').fill('Rechazo manual');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Rechazado', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Autorizaciones', exact: true }).click();
  await page.getByLabel('Alcance AVL exacto').fill('API_6A');
  await page.getByRole('button', { name: 'Consultar elegibilidad' }).click();
  await expect(page.getByText('No elegible', { exact: false })).toBeVisible();
  expect(state.requests.find((r) => r.path.endsWith('/eligibility'))?.query.get('avlScope')).toBe(
    'API_6A',
  );
});
test('quota approver selects yards without YARD_READ and region excludes stale yard selection', async ({
  page,
}) => {
  const state = await partnersFixture(page, ['PARTY_READ', 'PARTY_APPROVE']);
  await login(page);
  await page.goto('/terceros/' + partyId + '/cuotas');
  await page.getByRole('button', { name: '+ Nuevo registro' }).click();
  await page.getByLabel('Patio activo').selectOption({ label: 'PT-MTY · Patio Monterrey' });
  await page.getByLabel('Ubicación', { exact: true }).selectOption('REGION');
  await page.getByLabel('Código de región').fill('NORTH');
  await page.getByLabel('Alcance contractual').fill('TUBULAR_API5CT');
  await page.getByLabel('Cantidad', { exact: false }).fill('2');
  await page.getByLabel('Inicio', { exact: true }).fill('2030-01-01T00:00');
  await page.getByLabel('Fin exclusivo', { exact: true }).fill('2030-02-01T00:00');
  await page.getByLabel('Condiciones', { exact: false }).fill('Compromiso contractual');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('NORTH', { exact: true })).toBeVisible();
  const body = state.requests.find(
    (r) => r.method === 'POST' && r.path.endsWith('/distribution-quotas'),
  )!.body;
  expect(body['yardUuid']).toBeNull();
  expect(body['regionCode']).toBe('NORTH');
});
for (const width of [390, 768, 1280, 1440])
  test('responsive keyboard and content at ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await partnersFixture(page);
    await login(page);
    await page.goto('/terceros');
    await expect(page.getByRole('heading', { name: 'Directorio de terceros' })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole('button', { name: '+ Nuevo tercero' }).click();
    await page.getByRole('dialog').getByLabel('Razón social', { exact: false }).focus();
    await expect(
      page.getByRole('dialog').getByLabel('Razón social', { exact: false }),
    ).toBeFocused();
    await expectNoPageOverflow(page);
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('link', { name: 'Abrir expediente' }).click();
    await expect(
      page.getByRole('heading', { name: 'Tercero de prueba', exact: true }),
    ).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole('link', { name: 'Evidencias', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Evidencias', exact: true })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: 'test-results/stage-two-' + width + '.png', fullPage: true });
  });
