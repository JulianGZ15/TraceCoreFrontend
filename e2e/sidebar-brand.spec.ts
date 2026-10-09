import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fixtureApi } from './api-fixture';

test('published isotipo preserves the emblem and keeps all geometry inside its viewBox', async ({
  page,
}) => {
  const source = await readFile('../../assets/tracecore-isotipo.svg');
  const copy = await readFile('public/assets/brand/tracecore-isotipo.svg');
  const original = await readFile('../../assets/tracecore-colores-planos.svg');
  const originalCopy = await readFile('public/assets/brand/tracecore-colores-planos.svg');
  expect(copy.equals(source)).toBe(true);
  expect(originalCopy.equals(original)).toBe(true);
  await page.setContent(source.toString());
  const geometry = await page.locator('#emblema').evaluate((el) => {
    const rect = (el as SVGGraphicsElement).getBBox();
    return { x: rect.x, y: rect.y, right: rect.x + rect.width, bottom: rect.y + rect.height };
  });
  expect(geometry.x).toBeGreaterThanOrEqual(330);
  expect(geometry.y).toBeGreaterThanOrEqual(130);
  expect(geometry.right).toBeLessThanOrEqual(1060);
  expect(geometry.bottom).toBeLessThanOrEqual(620);
  await expect(page.locator('#nombre, #lema, #marca-registrada, [id^="word-"]')).toHaveCount(0);
  await expect(page.locator('#torre')).toHaveCount(1);
  await expect(page.locator('use').last()).toHaveAttribute('xlink:href', '#orbit');
});

test('production brand resources load under a non-root Angular base path', async ({
  page,
}, info) => {
  const root = resolve('dist/TraceCore/browser');
  const types: Record<string, string> = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.html': 'text/html',
  };
  await page.route('**/tracecore/**', async (route) => {
    const name = decodeURIComponent(
      new URL(route.request().url()).pathname.slice('/tracecore/'.length),
    );
    const path = resolve(root, name);
    if (!path.startsWith(root + sep)) return route.fulfill({ status: 404 });
    const extension = extname(path);
    if (!extension || extension === '.html') {
      const index = (await readFile(resolve(root, 'index.html'), 'utf8')).replace(
        '<base href="/">',
        '<base href="/tracecore/">',
      );
      return route.fulfill({ contentType: 'text/html', body: index });
    }
    try {
      await route.fulfill({
        contentType: types[extension] ?? 'application/octet-stream',
        body: await readFile(path),
      });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });
  await fixtureApi(page);
  await page.goto('/tracecore/login');
  const fullLogo = page.locator('tc-brand-logo img');
  await expect
    .poll(() => fullLogo.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBe(1300);
  expect(await fullLogo.evaluate((img) => (img as HTMLImageElement).currentSrc)).toContain(
    '/tracecore/assets/brand/tracecore-colores-planos.svg',
  );
  await page.getByLabel('Correo electrónico', { exact: true }).fill('ana@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixtureOnly123!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/tracecore[/]inicio/);
  const isotipo = page.locator('.desktop-sidebar tc-brand-logo img');
  await expect
    .poll(() => isotipo.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBe(730);
  expect(await isotipo.evaluate((img) => (img as HTMLImageElement).currentSrc)).toContain(
    '/tracecore/assets/brand/tracecore-isotipo.svg',
  );
  await page.screenshot({ path: info.outputPath('sidebar-production-base-path.png') });
});
