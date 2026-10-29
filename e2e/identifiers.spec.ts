import { expect, test } from '@playwright/test';
import { BinaryBitmap, HybridBinarizer, QRCodeReader, RGBLuminanceSource } from '@zxing/library';
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
  const qrPixels = await qr.evaluate((image: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo leer el QR generado.');
    context.drawImage(image, 0, 0);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = new Uint8Array(width * height);
    for (let i = 0; i < pixels.length; i++) {
      const offset = i * 4;
      pixels[i] = (data[offset] * 299 + data[offset + 1] * 587 + data[offset + 2] * 114) / 1000;
    }
    return { width, height, pixels: Array.from(pixels) };
  });
  const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(new Uint8Array(qrPixels.pixels), qrPixels.width, qrPixels.height)));
  const decodedUrl = new URL(new QRCodeReader().decode(bitmap).getText());
  expect(decodedUrl.origin).toBe(new URL(page.url()).origin);
  expect(decodedUrl.pathname).toBe(`/equipos/${f.asset}/general`);
  const qrDownload = page.getByRole('link', { name: 'Descargar QR SVG' });
  const barcodeDownload = page.getByRole('link', { name: 'Descargar barras SVG' });
  await expect(qrDownload).toHaveAttribute('download', 'ROOT-01-qr.svg');
  await expect(qrDownload).toHaveAttribute('href', /^blob:/);
  await expect(barcodeDownload).toHaveAttribute('download', 'ROOT-01-code128.svg');
  await expect(barcodeDownload).toHaveAttribute('href', /^blob:/);
  expect(f.state.requests.some((request) => request.path === '/inventory/assets/identifiers' && JSON.stringify(request.body['assetUuids']) === JSON.stringify([f.asset]))).toBe(true);
});
