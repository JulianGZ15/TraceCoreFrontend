import { test, expect } from '@playwright/test';
import { logisticsFixture, lids } from './logistics-fixture';
import { login, expectNoPageOverflow } from './api-fixture';
test('yard logistics reader reaches manifest without catalog or party permissions', async ({
  page,
}) => {
  await logisticsFixture(page, 'yard');
  await login(page);
  await page.goto('/logistica/manifiestos');
  await expect(page.getByRole('heading', { name: 'Manifiestos' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await expect(page.getByText('3 piezas').first()).toBeVisible();
});
test('read-only does not offer management actions', async ({ page }) => {
  await logisticsFixture(page, 'reader');
  await login(page);
  await page.goto('/logistica/manifiestos/' + lids.manifest + '/viaje');
  await expect(page.getByRole('button', { name: /Corregir viaje|Planificar viaje/ })).toHaveCount(
    0,
  );
});
test('trip conflict preserves fields and requires explicit reload before confirmation', async ({
  page,
}) => {
  const f = await logisticsFixture(page);
  await login(page);
  await page.goto('/logistica/manifiestos/' + lids.manifest + '/viaje');
  await page.getByRole('button', { name: 'Corregir viaje' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Vehículo principal', { exact: true })).toHaveValue(lids.vehicle);
  await expect(dialog.getByLabel('Chofer', { exact: true })).toHaveValue(lids.driver);
  await dialog.getByLabel('Motivo de corrección').fill('Cambio de horario autorizado');
  const eta = new Date(Date.now() + 7200000).toISOString();
  await dialog.getByLabel('Llegada prevista (ETA)', { exact: true }).fill(eta);
  f.conflict = true;
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog.getByText(/Conflicto/)).toBeVisible();
  await expect(dialog.getByLabel('Llegada prevista (ETA)', { exact: true })).toHaveValue(eta);
  expect(f.writes).toHaveLength(1);
  f.conflict = false;
  f.trip.version = 3;
  f.manifest.version = 5;
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Consultar datos actuales' }).click();
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(f.writes[1].body.version).toBe(3);
  expect(f.writes[1].body.manifestVersion).toBe(5);
});
test('manual observation starts empty and RFID sends every persisted receipt', async ({ page }) => {
  const f = await logisticsFixture(page);
  await login(page);
  await page.goto('/logistica/manifiestos/' + lids.manifest + '/verificacion');
  expect(await page.locator('input[type=checkbox]:checked').count()).toBe(0);
  await page.getByLabel('Método', { exact: true }).selectOption('RFID');
  await page.getByLabel('UUID de sesión RFID').fill(lids.session);
  await page.getByRole('button', { name: /Consultar piezas y todos los recibos/ }).click();
  await page.getByLabel('Referencia de comprobación').fill('Comprobación RFID completa');
  await page.getByRole('button', { name: /Guardar comprobación/ }).click();
  await expect(page).toHaveURL(/comprobaciones\//);
  expect(f.writes[0].body.eventUuids).toEqual(f.events);
});
test('partial delivery captures every component and preserves the other root', async ({ page }) => {
  const f = await logisticsFixture(page, 'receiver');
  f.manifest.state = 'IN_TRANSIT';
  await login(page);
  await page.goto('/logistica/manifiestos/' + lids.manifest + '/recepcion');
  await page.getByRole('button', { name: 'Abrir', exact: true }).first().click();
  await page.getByLabel('Nombre de quien recibe').fill('Receptor destino');
  await page.getByLabel('Referencia de entrega').fill('Entrega-001');
  await page.getByLabel('Observación de raíces pendientes').fill('La raíz B queda en tránsito');
  await page
    .getByRole('combobox', { name: 'Evidencia de entrega', exact: true })
    .selectOption(lids.evidence);
  await page.getByLabel('Condición común').selectOption('SERVICEABLE');
  await page.getByLabel('Observación común').fill('Recepción declarada sin inspección técnica');
  await page.getByRole('button', { name: 'Aplicar explícitamente a estas piezas' }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Confirmar entrega seleccionada' }).click();
  await expect(page).toHaveURL(/entregas\//);
  expect(f.writes[0].body.roots).toHaveLength(1);
  expect(f.writes[0].body.roots[0].pieces).toHaveLength(2);
  expect(f.manifest.state).toBe('PARTIALLY_DELIVERED');
});
for (const width of [390, 768, 1280, 1440])
  test('logistics layouts contain scrolling at ' + width, async ({ page }, info) => {
    const fixture = await logisticsFixture(page);
    await page.setViewportSize({ width, height: 1000 });
    await login(page);
    for (const section of ['general', 'carga', 'viaje', 'comprobaciones', 'evidencias']) {
      await page.goto('/logistica/manifiestos/' + lids.manifest + '/' + section);
      await expect(page.locator('tc-page-heading')).toBeVisible();
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: info.outputPath('logistics-' + section + '-' + width + '.png'),
        fullPage: true,
      });
    }
    await page.goto('/logistica/manifiestos/' + lids.manifest + '/viaje');
    await page.getByRole('button', { name: 'Corregir viaje' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({
      path: info.outputPath('trip-dialog-' + width + '.png'),
      fullPage: true,
    });
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press('Tab');
      expect(
        await page.getByRole('dialog').evaluate((e) => e.contains(document.activeElement)),
      ).toBe(true);
    }
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Corregir viaje' })).toBeFocused();
    await page.goto('/logistica/manifiestos/nuevo');
    await expect(page.getByRole('heading', { name: 'Nuevo manifiesto' })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({
      path: info.outputPath('preparation-' + width + '.png'),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Paso 2', exact: true }).click();
    await expect(page.locator('tc-logistics-movement-root')).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({
      path: info.outputPath('root-preparation-' + width + '.png'),
      fullPage: true,
    });
    await page.goto('/logistica/manifiestos/' + lids.manifest + '/verificacion');
    await expect(page.getByLabel('Referencia de comprobación')).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({
      path: info.outputPath('verification-' + width + '.png'),
      fullPage: true,
    });
    fixture.manifest.state = 'CHECKED';
    await page.goto('/logistica/manifiestos/' + lids.manifest + '/despacho');
    await expect(
      page.getByRole('button', { name: 'Confirmar salida de toda la carga' }),
    ).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: info.outputPath('dispatch-' + width + '.png'), fullPage: true });
    fixture.manifest.state = 'IN_TRANSIT';
    await page.goto('/logistica/manifiestos/' + lids.manifest + '/recepcion');
    await page.getByRole('button', { name: 'Abrir', exact: true }).first().click();
    await expect(page.getByLabel('Condición común')).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: info.outputPath('reception-' + width + '.png'), fullPage: true });
  });
