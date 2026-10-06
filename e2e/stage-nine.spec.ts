import { test, expect } from '@playwright/test';
import { financeFixture, fids } from './finance-fixture';
import { login, expectNoPageOverflow } from './api-fixture';
async function financeLogin(page: import('@playwright/test').Page) {
  await login(page);
  await expect(page).toHaveURL(/\/(inicio|sin-acceso)$/);
}
test('finance company reader has exact historical access without other module permissions', async ({
  page,
}) => {
  await financeFixture(page, 'reader');
  await financeLogin(page);
  await page.goto('/finanzas/facturas/' + fids.invoice);
  await expect(page.getByText('99999999999999.99999999').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar factura' })).toHaveCount(0);
  await page.goto('/finanzas/terceros/' + fids.party + '/resumen');
  await expect(page.getByRole('heading', { name: 'Tercero de prueba' })).toBeVisible();
});
test('finance yard scope cannot grant global access', async ({ page }) => {
  await financeFixture(page, 'yard');
  await financeLogin(page);
  await page.goto('/finanzas/facturas');
  await expect(page).toHaveURL(/sin-acceso/);
});
test('finance writing capability does not imply reading', async ({ page }) => {
  await financeFixture(page, 'writer');
  await financeLogin(page);
  await expect(page.getByText(/FINANCE_READ COMPANY/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Finanzas', exact: true })).toHaveCount(0);
  await page.goto('/finanzas/facturas');
  await expect(page).toHaveURL(/sin-acceso/);
});
async function prepare(page: import('@playwright/test').Page) {
  await page.goto('/finanzas/facturas/nueva');
  await page.getByLabel('Serie', { exact: true }).fill('ADM');
  await page.getByLabel('Folio', { exact: true }).fill('NUEVA-001');
  await page.getByRole('combobox', { name: 'Tercero', exact: true }).selectOption(fids.party);
  await page.getByLabel('Referencia', { exact: true }).fill('Referencia de prueba');
  await page
    .getByRole('combobox', { name: 'Cargo disponible', exact: true })
    .selectOption(fids.charge);
  await page.getByRole('button', { name: 'Agregar fuente' }).click();
  await page.getByLabel('Neto de fuente 1').fill('99999999999999.99999999');
  await page.getByRole('button', { name: 'Calcular vista previa' }).click();
  await expect(
    page.getByRole('heading', { name: 'Vista previa calculada por el servidor' }),
  ).toBeVisible();
}
test('cancelled draft is recreated with the same folio and a new UUID after another preview', async ({
  page,
}) => {
  const f = await financeFixture(page);
  await financeLogin(page);
  await page.goto('/finanzas/facturas/' + fids.invoice);
  await page.getByRole('button', { name: 'Cancelar borrador' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Motivo').fill('Corrección documentada');
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.getByRole('link', { name: 'Recrear con nuevo UUID' }).click();
  await expect(page.getByLabel('Folio', { exact: true })).toHaveValue('FIN-001');
  await expect(page.getByLabel('Neto de fuente 1')).toHaveValue('99999999999999.99999999');
  await expect(page.getByRole('button', { name: 'Guardar DRAFT' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Calcular vista previa' }).click();
  await expect(
    page.getByRole('heading', { name: 'Vista previa calculada por el servidor' }),
  ).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Guardar DRAFT' }).click();
  await expect(page).toHaveURL(/facturas\/[a-f0-9-]{36}\/resumen/);
  expect(f.writes).toHaveLength(2);
  expect(f.writes[0].path).toBe('/invoices/' + fids.invoice + '/cancel');
  expect(f.writes[1].body.uuid).not.toBe(fids.invoice);
  expect(f.writes[1].body.folio).toBe('FIN-001');
  expect(f.writes[1].body.expectedCalculationFingerprint).toBe('current-calculation');
});
test('invoice is saved independently as DRAFT with exact strings and reviewed fingerprint', async ({
  page,
}) => {
  const f = await financeFixture(page);
  await financeLogin(page);
  await prepare(page);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Guardar DRAFT' }).click();
  await expect(page).toHaveURL(/facturas\/[a-f0-9-]{36}\/resumen/);
  expect(f.writes[0].body.parts[0].netAmount).toBe('99999999999999.99999999');
  expect(f.writes[0].body.expectedCalculationFingerprint).toBe('current-calculation');
  expect(f.invoice.state).toBe('DRAFT');
});
test('editing an invoice invalidates preview and lost response is recovered without another write', async ({
  page,
}) => {
  const f = await financeFixture(page);
  await financeLogin(page);
  await prepare(page);
  await page.getByLabel('Folio', { exact: true }).fill('NUEVA-002');
  await expect(page.getByRole('button', { name: 'Guardar DRAFT' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Calcular vista previa' }).click();
  f.loseResponse = true;
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Guardar DRAFT' }).click();
  await expect(page.getByRole('button', { name: 'Consultar resultado' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Consultar resultado' }).click();
  await expect(page.getByRole('link', { name: 'Abrir resultado' })).toBeVisible();
  expect(f.writes).toHaveLength(1);
});
test('credit conflict preserves the draft and refreshes only after explicit consultation', async ({
  page,
}) => {
  const f = await financeFixture(page);
  await financeLogin(page);
  await page.goto('/finanzas/cuentas/' + fids.account);
  await page.getByRole('button', { name: 'Cambiar límite' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nuevo límite').fill('2000.12345678');
  await dialog.getByLabel('Motivo').fill('Aumento autorizado');
  f.conflict = true;
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(dialog.getByLabel('Nuevo límite')).toHaveValue('2000.12345678');
  await expect(dialog.getByRole('button', { name: 'Confirmar', exact: true })).toBeDisabled();
  f.conflict = false;
  f.account.version = 3;
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Consultar datos actuales' }).click();
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(f.writes[1].body.version).toBe(3);
  expect(f.writes[1].body.creditLimit).toBe('2000.12345678');
});
for (const width of [390, 768, 1280, 1440])
  test('financial layouts, exact amounts and dialogs at ' + width, async ({ page }, info) => {
    await financeFixture(page);
    await page.setViewportSize({ width, height: 1000 });
    await financeLogin(page);
    for (const path of [
      '/finanzas/facturas',
      '/finanzas/facturas/' + fids.invoice,
      '/finanzas/facturas/' + fids.invoice + '/aplicaciones',
      '/finanzas/terceros/' + fids.party + '/resumen',
      '/finanzas/cuentas/' + fids.account,
      '/finanzas/facturas/nueva',
    ]) {
      await page.goto(path);
      await expect(page.locator('tc-page-heading')).toBeVisible();
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: info.outputPath('finance-' + path.split('/').pop() + '-' + width + '.png'),
        fullPage: true,
      });
    }
    await prepare(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectNoPageOverflow(page);
    await page.screenshot({
      path: info.outputPath('finance-preview-' + width + '.png'),
      fullPage: true,
    });
    page.once('dialog', (d) => d.accept());
    await page.goto('/finanzas/cuentas/' + fids.account);
    await page.getByRole('button', { name: 'Cambiar límite' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoPageOverflow(page);
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(
        await page.getByRole('dialog').evaluate((e) => e.contains(document.activeElement)),
      ).toBe(true);
    }
    await page.screenshot({
      path: info.outputPath('finance-limit-' + width + '.png'),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Cambiar límite' })).toBeFocused();
  });
