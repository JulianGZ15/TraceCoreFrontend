import { test, expect } from '@playwright/test';
import { partnersFixture, partyId } from './partners-fixture';
import { fixtureApi, login, expectNoPageOverflow } from './api-fixture';

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1280, height: 600 },
];

for (const viewport of viewports) {
  test(`shared table scroll and geometry at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    const state = await partnersFixture(page);
    await page.route('**/api/v1/parties?*', async (route) => {
      await route.fulfill({
        json: Array.from({ length: 25 }, (_, i) => ({
          ...state.party,
          uuid: `${partyId.slice(0, -2)}${String(i + 10).padStart(2, '0')}`,
          legalName: `Empresa ${i + 1} con una razón social extensa que debe permanecer legible`,
        })),
      });
    });
    await login(page);
    await page.goto('/terceros');
    const table = page.locator('tc-data-table');
    await expect(table.locator('tbody tr')).toHaveCount(25);
    await expect(table.getByRole('region', { name: 'Directorio de terceros' })).toHaveCount(1);
    await expectNoPageOverflow(page);
    const region = table.locator('.tc-table-scroll');
    const desktop = viewport.width >= 1024 && viewport.height >= 700;
    if (desktop) {
      const headingBefore = await table.locator('th').first().boundingBox();
      expect(headingBefore!.y).toBeLessThan(320);
      expect(await region.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
      await region.evaluate((el) => {
        el.scrollTop = 300;
      });
      const headingAfter = await table.locator('th').first().boundingBox();
      expect(Math.abs(headingAfter!.y - headingBefore!.y)).toBeLessThan(2);
      await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeVisible();
    } else {
      expect(await table.evaluate((el) => el.clientHeight)).toBeGreaterThan(700);
      await region.focus();
      await expect(region).toBeFocused();
      if (viewport.width === 390) {
        expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
        await region.evaluate((el) => {
          el.scrollLeft = 0;
        });
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: info.outputPath(`table-viewport-${viewport.width}x${viewport.height}.png`),
    });
    await page.screenshot({
      path: info.outputPath(`table-${viewport.width}x${viewport.height}.png`),
      fullPage: !desktop,
    });
  });
}

test('admin and directory tables share cell styling and keep keyboard actions', async ({
  page,
}, info) => {
  await fixtureApi(page);
  await login(page);
  await page.goto('/acceso/usuarios');
  const table = page.locator('tc-data-table');
  await expect(table.getByRole('region', { name: 'Tabla de usuarios' })).toBeVisible();
  const admin = await table
    .locator('th')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, padding: s.padding, fontSize: s.fontSize };
    });
  const edit = table.getByRole('button', { name: 'Editar', exact: true }).first();
  await edit.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(edit).toBeFocused();
  await page.screenshot({ path: info.outputPath('users-table.png') });
  await partnersFixture(page);
  await page.goto('/terceros');
  await expect(page.locator('tc-data-table tbody tr')).toHaveCount(1);
  const directory = await page
    .locator('tc-data-table th')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, padding: s.padding, fontSize: s.fontSize };
    });
  expect(directory).toEqual(admin);
});

test('directory refresh retains loaded rows and keeps the initial skeleton hidden', async ({
  page,
}) => {
  const state = await partnersFixture(page);
  let hold = false;
  let release: (() => void) | undefined;
  await page.route('**/api/v1/parties?*', async (route) => {
    if (hold)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    await route.fulfill({ json: [state.party] });
  });
  await login(page);
  await page.goto('/terceros');
  const table = page.locator('tc-data-table');
  await expect(table.locator('tbody tr')).toHaveCount(1);
  hold = true;
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(table.locator('.tc-table-scroll')).toHaveAttribute('aria-busy', 'true');
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await expect(table.locator('tc-skeleton')).toHaveCount(0);
  await expect.poll(() => !!release).toBe(true);
  hold = false;
  release!();
  await expect(table.locator('.tc-table-scroll')).toHaveAttribute('aria-busy', 'false');
});

test('200 percent zoom equivalent keeps long values and actions available', async ({
  page,
}, info) => {
  // A 1440px window at 200% has 720 CSS pixels available for responsive layout.
  await page.setViewportSize({ width: 720, height: 450 });
  const state = await partnersFixture(page);
  state.party.legalName =
    'Empresa con razón social extensa y referencias de trazabilidad completas';
  await login(page);
  await page.goto('/terceros');
  await expect(page.getByText(state.party.legalName, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir expediente' })).toBeVisible();
  await expectNoPageOverflow(page);
  await page.screenshot({ path: info.outputPath('table-reflow-200-percent.png'), fullPage: true });
});
