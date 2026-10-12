import { expect, test } from '@playwright/test';
import { inventoryFixture } from './inventory-fixture';

test('genera QR y Code 128 del mismo activo y prepara etiquetas imprimibles', async ({ page }) => {
  const f = await inventoryFixture(page);
  await page.goto('/inventario/identificacion');
  for (const width of [390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByRole('heading', { name: 'Identificación con QR y código de barras' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByLabel(/ROOT-01/).check();
  await page.getByRole('button', { name: 'Generar vista previa' }).click();
  await expect(page.getByRole('heading', { name: 'Vista previa · 1 etiquetas' })).toBeVisible();
  const qr = page.getByRole('img', { name: 'Código QR del activo' });
  const barcode = page.getByRole('img', { name: 'Código de barras Code 128 del activo' });
  await expect(qr).toBeVisible();
  await expect(barcode).toBeVisible();
  await expect.poll(() => qr.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect.poll(() => barcode.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(f.state.requests.some((request) => request.path === '/inventory/assets/identifiers' && JSON.stringify(request.body['assetUuids']) === JSON.stringify([f.asset]))).toBe(true);
});
