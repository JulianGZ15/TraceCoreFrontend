import { test } from '@playwright/test';
import { login, ids } from './api-fixture';
import { commerceFixture } from './commerce-fixture';
import { financeFixture } from './finance-fixture';
import { documentsFixture } from './documents-fixture';
import * as path from 'path';
import * as fs from 'fs';

const screenshotDir = 'C:\\Users\\jjgm1\\.gemini\\antigravity\\brain\\af2d4bdd-bdbf-495b-9f3a-ae3f4a9cda0c\\screenshots';

test.beforeAll(() => {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});

test('capture commerce orders search toolbar and drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await commerceFixture(page);
  await login(page);

  await page.goto('/comercial/ordenes?type=OR&state=DRAFT&currency=MXN');
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(screenshotDir, 'commerce_orders_toolbar.png'),
    fullPage: false,
  });

  await page.getByRole('button', { name: /Filtros/i }).click();
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(screenshotDir, 'commerce_orders_drawer.png'),
    fullPage: false,
  });
});

test('capture finance invoices search toolbar and drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await financeFixture(page);
  await login(page);

  await page.goto('/finanzas/facturas?direction=RECEIVABLE&state=DRAFT&currency=MXN');
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(screenshotDir, 'finance_invoices_toolbar.png'),
    fullPage: false,
  });

  await page.getByRole('button', { name: /Filtros/i }).click();
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(screenshotDir, 'finance_invoices_drawer.png'),
    fullPage: false,
  });
});

test('capture documents library search toolbar and drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await documentsFixture(page);
  await login(page);

  await page.goto('/documentos?classification=INTERNAL&state=ACTIVE');
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(screenshotDir, 'documents_library_toolbar.png'),
    fullPage: false,
  });

  await page.getByRole('button', { name: /Filtros/i }).click();
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(screenshotDir, 'documents_library_drawer.png'),
    fullPage: false,
  });
});

test('capture queries inventory search toolbar and drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await documentsFixture(page);
  await login(page);

  await page.goto('/consultas/inventario?yardUuid=' + ids.yard + '&lifecycle=ACTIVE');
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(screenshotDir, 'queries_inventory_toolbar.png'),
    fullPage: false,
  });

  await page.getByRole('button', { name: /Filtros/i }).click();
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(screenshotDir, 'queries_inventory_drawer.png'),
    fullPage: false,
  });
});
