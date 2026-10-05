import { test, expect } from '@playwright/test';
import { commerceFixture, cids } from './commerce-fixture';
import { login, expectNoPageOverflow, ids } from './api-fixture';
test('yard reader without other modules can open direct commercial routes', async ({ page }) => {
  await commerceFixture(page, 'yard');
  await login(page);
  await page.goto('/comercial/ordenes?yardUuid=' + ids.yard);
  await expect(page.getByText('RENTA-001', { exact: true })).toBeVisible();
  await page.goto('/comercial/ordenes/' + cids.order + '/partidas');
  await expect(page.getByText('99999999999999.9999').first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Agregar partida' })).toBeVisible();
});
test('read-only and write-only capabilities stay independent', async ({ page }) => {
  await commerceFixture(page, 'reader');
  await login(page);
  await page.goto('/comercial/ordenes');
  await expect(page.getByRole('link', { name: 'Nueva orden' })).toHaveCount(0);
  await page.goto('/comercial/ordenes/' + cids.order + '/partidas');
  await expect(page.getByRole('button', { name: 'Agregar partida' })).toHaveCount(0);
});
test('line conflict preserves exact draft and does not retry', async ({ page }) => {
  const f = await commerceFixture(page);
  await login(page);
  await page.goto('/comercial/ordenes/' + cids.order + '/partidas');
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await page.getByRole('button', { name: 'Editar borrador' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Concepto', { exact: true }).fill('Conservar revisión local');
  f.conflict = true;
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog.getByText(/Conflicto:/)).toBeVisible();
  await expect(dialog.getByLabel('Concepto', { exact: true })).toHaveValue(
    'Conservar revisión local',
  );
  await expect(dialog.getByLabel('Precio unitario', { exact: true })).toHaveValue(
    '99999999999999.9999',
  );
  expect(f.writes.filter((w) => w.method === 'PUT')).toHaveLength(1);
  f.conflict = false;
  f.line.version = 2;
  f.order.version = 3;
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Consultar datos actuales' }).click();
  await expect(dialog.getByLabel('Concepto', { exact: true })).toHaveValue(
    'Conservar revisión local',
  );
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const writes = f.writes.filter((w) => w.method === 'PUT');
  expect(writes).toHaveLength(2);
  expect(writes[1].body.version).toBe(2);
  expect(writes[1].body.orderVersion).toBe(3);
});

test('lost creation is recovered after reload without a second POST', async ({ page }) => {
  const f = await commerceFixture(page);
  await login(page);
  await page.goto('/comercial/ordenes/nueva?yardUuid=' + ids.yard);
  await page.getByLabel('Folio', { exact: true }).fill('OC-RECUPERABLE');
  await page.getByLabel('Contraparte', { exact: true }).selectOption(cids.party);
  await page.getByLabel('Referencia de términos', { exact: true }).fill('Referencia contractual');
  await page.getByLabel('Fecha prometida', { exact: true }).fill('2026-11-01T12:00:00Z');
  await page.getByLabel('Condiciones de entrega', { exact: true }).fill('Entrega pactada');
  f.loseResponse = true;
  await page.getByRole('button', { name: 'Guardar cabecera DRAFT', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Consultar resultado' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Consultar resultado' }).click();
  await expect(page.getByText('Resultado recuperado:', { exact: false })).toBeVisible();
  expect(f.creates).toHaveLength(1);
  expect(f.writes.filter((w) => w.path === '/orders')).toHaveLength(1);
});
test('obsolete preview retains interval; definitive request includes fingerprint', async ({
  page,
}) => {
  const f = await commerceFixture(page);
  await login(page);
  await page.goto('/comercial/asignaciones/' + cids.assignment + '/corte');
  await page.getByLabel('Fin con offset').fill('2026-10-02T12:00:00Z');
  await page.getByRole('button', { name: /Previsualizar en servidor/ }).click();
  await expect(page.getByText('1234.5678').first()).toBeVisible();
  page.on('dialog', (d) => d.accept());
  f.previewConflict = true;
  await page.getByRole('button', { name: /Confirmar corte/ }).click();
  await expect(page.getByText(/Conflicto:/)).toBeVisible();
  await expect(page.getByLabel('Fin con offset')).toHaveValue('2026-10-02T12:00:00Z');
  expect(f.writes.find((w) => w.path === '/billings').body.expectedCalculationFingerprint).toBe(
    'preview-fingerprint',
  );
});
test('return form renders after asynchronous contract loading on a direct route', async ({ page }) => {
  await commerceFixture(page);
  await login(page);
  await page.goto('/comercial/rentas/' + cids.rental + '/devoluciones/nueva');
  await expect(page.getByLabel('Folio de devolución', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Recepción administrativa del cliente final', { exact: true })).toBeVisible();
});
for (const width of [390, 768, 1280, 1440])
  test('commerce responsive ' + width, async ({ page }, info) => {
    await commerceFixture(page);
    await login(page);
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, path] of [
      ['directory', '/comercial/ordenes'],
      ['dossier', '/comercial/ordenes/' + cids.order + '/general'],
      ['form', '/comercial/ordenes/nueva?yardUuid=' + ids.yard],
      ['billing', '/comercial/asignaciones/' + cids.assignment + '/corte'],
    ]) {
      await page.goto(path);
      await expect(page.locator('tc-page-heading')).toBeVisible();
      await expectNoPageOverflow(page);
      await page.screenshot({ path: info.outputPath(name + '-' + width + '.png'), fullPage: true });
    }
    await page.goto('/comercial/ordenes/' + cids.order + '/partidas');
    await page.getByRole('button', { name: 'Agregar partida' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoPageOverflow(page);
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath('dialog-' + width + '.png'), fullPage: true });
  });
