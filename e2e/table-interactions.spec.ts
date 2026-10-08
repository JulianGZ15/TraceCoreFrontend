import { test, expect } from '@playwright/test';
import { fixtureApi, ids, login, expectNoPageOverflow } from './api-fixture';
import { commerceFixture, cids } from './commerce-fixture';
import { financeFixture } from './finance-fixture';

test('financial adapter owns one scroll region and preserves exact values on refresh', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await financeFixture(page);
  let hold = false;
  let release: (() => void) | undefined;
  await page.route('**/api/v1/finance/invoices/directory?*', async (route) => {
    if (hold)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    await route.fulfill({
      json: Array.from({ length: 25 }, (_, i) => ({
        record: {
          ...state.invoice,
          uuid: `${state.invoice.uuid.slice(0, -2)}${String(i + 10).padStart(2, '0')}`,
        },
        label: 'Cliente industrial',
      })),
    });
  });
  await login(page);
  await page.goto('/finanzas/facturas');
  const table = page.locator('tc-finance-records tc-data-table');
  await expect(table.locator('tbody tr')).toHaveCount(25);
  const region = table.locator('.tc-table-scroll');
  expect(await region.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(table.getByText('99999999999999.99999999', { exact: true }).first()).toBeVisible();
  await expect(table.locator('td.table-number').first()).toHaveCSS('text-align', 'right');
  hold = true;
  await page.getByRole('button', { name: 'Recargar', exact: true }).click();
  await expect(region).toHaveAttribute('aria-busy', 'true');
  await expect(table.locator('tbody tr')).toHaveCount(25);
  await expect(table.locator('tc-skeleton')).toHaveCount(0);
  await expect.poll(() => !!release).toBe(true);
  hold = false;
  release!();
  await expect(region).toHaveAttribute('aria-busy', 'false');
  await expectNoPageOverflow(page);
});

test('RFID table preserves selection while paging receipts', async ({ page }, info) => {
  const auth = await fixtureApi(page);
  await page.route('**/api/v1/auth/context', (route) =>
    route.fulfill({
      json: {
        company: auth.company,
        companyPermissions: ['RFID_READ', 'RFID_SCAN'],
        yards: auth.yards,
      },
    }),
  );
  await page.route('**/api/v1/rfid/sessions/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/events')) {
      const offset = Number(url.searchParams.get('offset') ?? 0);
      return route.fulfill({
        json: Array.from({ length: offset ? 1 : 25 }, (_, i) => ({
          version: 0,
          createdAt: '2026-10-01T12:00:00Z',
          data: {
            uuid: `60000000-0000-4000-8000-${String(offset + i + 1).padStart(12, '0')}`,
            sessionUuid: ids.role,
            yardUuid: ids.yard,
            status: 'IDENTIFIED',
            assetUuid: ids.user,
            reading: {
              epc: '000000000000000000000005',
              tid: null,
              firstSeenAt: '2026-10-01T12:00:00Z',
              lastSeenAt: '2026-10-01T12:00:01Z',
              readCount: 1,
              rssi: -50,
            },
          },
        })),
      });
    }
    return route.fulfill({
      json: {
        authorization: {
          version: 0,
          createdAt: '2026-10-01T12:00:00Z',
          data: {
            uuid: ids.role,
            session: { uuid: ids.role, purpose: 'COUNT', yardUuid: ids.yard },
          },
        },
        remote: { available: false, rows: [] },
      },
    });
  });
  await login(page);
  await page.goto(`/rfid/sesiones/${ids.role}/conteo`);
  const table = page.locator('tc-data-table');
  await expect(table.locator('tbody tr')).toHaveCount(25);
  await table.getByRole('checkbox').first().check();
  await expect(page.getByText('Seleccionados: 1 / 500')).toBeVisible();
  await table.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByText('Seleccionados: 1 / 500')).toBeVisible();
  await table.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(table.getByRole('checkbox').first()).toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoPageOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('rfid-selection-mobile.png'), fullPage: true });
});

test('editable receipt keeps captured values after an administrative conflict', async ({
  page,
}, info) => {
  await commerceFixture(page);
  await page.route('**/api/v1/commercial/movement-options/*?*', (route) =>
    route.fulfill({
      json: {
        movement: { uuid: cids.party, state: 'COMPLETED' },
        items: [{ uuid: cids.line, rootAssetUuid: cids.model, assetUuid: cids.model }],
      },
    }),
  );
  await page.route('**/api/v1/commercial/receipts', (route) =>
    route.fulfill({
      status: 409,
      json: {
        code: 'CONFLICT',
        message: 'Conflicto de versión',
      },
    }),
  );
  await login(page);
  await page.goto(`/comercial/recepciones/nueva?yardUuid=${ids.yard}`);
  await page.getByLabel('Folio de recepción', { exact: true }).fill('REC-TABLA');
  await page.getByLabel('Origen', { exact: true }).selectOption(cids.party);
  await page.getByLabel('Movimiento completado', { exact: true }).selectOption(cids.party);
  await page.getByLabel('Referencia administrativa', { exact: true }).fill('Referencia conservada');
  await page.getByRole('button', { name: 'Consultar snapshot del movimiento' }).click();
  const table = page.locator('tc-data-table');
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await page
    .getByRole('checkbox', { name: `Incluir raíz ${cids.model} y todos sus componentes` })
    .check();
  await table
    .getByLabel(`Condición declarada de pieza ${cids.model}`, { exact: true })
    .selectOption('SERVICEABLE');
  const observation = table.getByLabel(`Observación de pieza ${cids.model}`, { exact: true });
  await observation.fill('Captura de recepción conservada');
  await page.getByRole('button', { name: 'Registrar recepción administrativa' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(observation).toHaveValue('Captura de recepción conservada');
  await expect(
    table.getByLabel(`Condición declarada de pieza ${cids.model}`, { exact: true }),
  ).toHaveValue('SERVICEABLE');
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoPageOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('editable-receipt-mobile.png'), fullPage: true });
});
