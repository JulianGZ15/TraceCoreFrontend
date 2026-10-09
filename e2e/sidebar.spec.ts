import { test, expect } from '@playwright/test';
import { fixtureApi, login, expectNoPageOverflow } from './api-fixture';
import { partnersFixture } from './partners-fixture';

const key = 'tracecore.sidebar.collapsed';
const sidebar = (page: import('@playwright/test').Page) => page.locator('.desktop-sidebar');
const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1280, height: 450 },
];

for (const viewport of viewports) {
  test(
    'sidebar geometry and table reflow at ' + viewport.width + 'x' + viewport.height,
    async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await partnersFixture(page, [
        'PARTY_READ',
        'PARTY_MANAGE',
        'PARTY_APPROVE',
        'AVL_MANAGE',
        'ORGANIZATION_READ',
        'ACCESS_MANAGE',
        'AUDIT_READ',
        'YARD_MANAGE',
      ]);
      await login(page);
      await page.goto('/terceros');
      await expect(page.locator('tc-data-table tbody tr')).toHaveCount(1);
      await expectNoPageOverflow(page);
      if (viewport.width < 1024) {
        await expect(sidebar(page)).toBeHidden();
        expect((await page.locator('.workspace').boundingBox())!.x).toBe(0);
        const opener = page.getByRole('button', { name: 'Abrir navegación' });
        await opener.click();
        const dialog = page.getByRole('dialog', { name: 'Navegación principal' });
        await expect(dialog.locator('.navigation')).not.toHaveClass(/collapsed/);
        await expect(dialog.locator('.sidebar-toggle')).toHaveCount(0);
        await expect(dialog.locator('tc-brand-logo img')).toHaveAttribute('src', /isotipo/);
        await expect(
          dialog.getByRole('link', { name: 'Usuarios', exact: true }).locator('.nav-text'),
        ).not.toHaveClass(/sr-only/);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
      } else {
        await expect.poll(async () => (await sidebar(page).boundingBox())!.width).toBe(72);
        expect((await page.locator('.workspace').boundingBox())!.x).toBe(72);
        await expect
          .poll(async () => (await sidebar(page).locator('tc-brand-logo img').boundingBox())!.width)
          .toBe(48);
        await expect(
          sidebar(page).getByRole('link', { name: 'Mi cuenta', exact: true }),
        ).toBeVisible();
        await expect(
          sidebar(page).getByRole('button', { name: 'Cerrar sesión', exact: true }),
        ).toBeVisible();
        const before = (await page.locator('.workspace').boundingBox())!.width;
        await sidebar(page).getByRole('button', { name: 'Expandir menú lateral' }).click();
        await expect.poll(async () => (await sidebar(page).boundingBox())!.width).toBe(280);
        await expect
          .poll(async () => (await sidebar(page).locator('tc-brand-logo img').boundingBox())!.width)
          .toBe(96);
        expect(before - (await page.locator('.workspace').boundingBox())!.width).toBe(208);
        await expectNoPageOverflow(page);
        await sidebar(page).getByRole('button', { name: 'Minimizar menú lateral' }).click();
        await expect.poll(async () => (await sidebar(page).boundingBox())!.width).toBe(72);
      }
      await page.screenshot({
        path: info.outputPath('sidebar-' + viewport.width + 'x' + viewport.height + '.png'),
      });
    },
  );
}

test('desktop choice survives reload and mobile round trips', async ({ page }) => {
  await fixtureApi(page);
  await login(page);
  await sidebar(page).getByRole('button', { name: 'Expandir menú lateral' }).click();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('false');
  await page.reload();
  await expect(
    sidebar(page).getByRole('button', { name: 'Minimizar menú lateral' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir navegación' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar navegación' }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(sidebar(page).getByRole('button', { name: 'Minimizar menú lateral' })).toBeVisible();
  await sidebar(page).getByRole('button', { name: 'Minimizar menú lateral' }).click();
  await page.reload();
  await expect(
    sidebar(page).getByRole('button', { name: 'Expandir menú lateral' }),
  ).toHaveAttribute('aria-expanded', 'false');
});

for (const blocked of [false, true]) {
  test('storage fallback: ' + (blocked ? 'blocked' : 'invalid'), async ({ page }) => {
    await page.addInitScript(
      ({ key, blocked }) => {
        if (blocked) {
          Storage.prototype.getItem = function (k) {
            if (k === key) throw new Error('blocked');
            return null;
          };
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function (k, value) {
            if (k === key) throw new Error('blocked');
            original.call(this, k, value);
          };
        } else localStorage.setItem(key, 'invalid');
      },
      { key, blocked },
    );
    await fixtureApi(page);
    await login(page);
    await sidebar(page).getByRole('button', { name: 'Expandir menú lateral' }).click();
    await expect(
      sidebar(page).getByRole('button', { name: 'Minimizar menú lateral' }),
    ).toBeVisible();
  });
}

test('overlay tooltips support hover, keyboard, Escape and scrolled destinations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 450 });
  await partnersFixture(page, [
    'PARTY_READ',
    'PARTY_MANAGE',
    'PARTY_APPROVE',
    'AVL_MANAGE',
    'ORGANIZATION_READ',
    'ACCESS_MANAGE',
    'AUDIT_READ',
    'YARD_MANAGE',
  ]);
  await login(page);
  const users = sidebar(page).getByRole('link', { name: 'Usuarios', exact: true });
  await users.hover();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toHaveText('Usuarios');
  await expect(users).toHaveAttribute('aria-describedby', (await tooltip.getAttribute('id')) ?? '');
  expect((await tooltip.boundingBox())!.x).toBeGreaterThanOrEqual(72);
  await users.focus();
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await page.locator('h1').focus();
  await page.mouse.move(500, 100);
  await users.focus();
  await expect(tooltip).toHaveText('Usuarios');
  const home = sidebar(page).getByRole('link', { name: 'Inicio', exact: true });
  await home.focus();
  await expect(tooltip).toHaveText('Inicio');
  await sidebar(page)
    .locator('nav')
    .evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect(tooltip).toHaveCount(0);
  // Keyboard focus scrolls every authorized destination into the central viewport.
  await page.locator('h1').focus();
  const links = sidebar(page).locator('nav a');
  const region = (await sidebar(page).locator('nav').boundingBox())!;
  for (let i = 0; i < (await links.count()); i++) {
    await links.nth(i).focus();
    const box = (await links.nth(i).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(region.y - 1);
    expect(box.y + box.height).toBeLessThanOrEqual(region.y + region.height + 1);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
  await page.locator('h1').focus();
  const parties = sidebar(page).getByRole('link', { name: 'Terceros y AVL', exact: true });
  await parties.hover();
  await expect(tooltip).toHaveText('Terceros y AVL');
  await parties.click();
  await expect(page).toHaveURL(/terceros/);
  await expect(parties).toHaveAttribute('aria-current', 'page');
  await expect(tooltip).toHaveCount(0);
});

test('operator permissions and logout remain usable in both desktop states', async ({ page }) => {
  await fixtureApi(page, 'operator');
  await login(page);
  for (const expanded of [false, true]) {
    if (expanded)
      await sidebar(page).getByRole('button', { name: 'Expandir menú lateral' }).click();
    await expect(sidebar(page).getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
    await sidebar(page).getByRole('link', { name: 'Mi cuenta', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Tu perfil', exact: true })).toBeVisible();
  }
  await sidebar(page).getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await expect(page.locator('tc-brand-logo img')).toHaveAttribute(
    'src',
    /tracecore-colores-planos.svg/,
  );
  await expect(page.locator('tc-brand-logo img')).toHaveAttribute('width', '1300');
});

test('reduced motion disables width and content transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixtureApi(page);
  await login(page);
  for (const locator of [sidebar(page), page.locator('.workspace')]) {
    expect(await locator.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
  }
});

test('full navigation keeps wheel and keyboard access without scrollbars and shares account selection', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await partnersFixture(page, [
    'DOCUMENT_READ',
    'QUERY_READ',
    'SUPPORT_READ',
    'FINANCE_READ',
    'LOGISTICS_READ',
    'COMMERCIAL_READ',
    'RFID_READ',
    'QUALITY_READ',
    'ORGANIZATION_READ',
    'YARD_MANAGE',
    'ACCESS_MANAGE',
    'AUDIT_READ',
    'PARTY_READ',
    'EQUIPMENT_READ',
    'INVENTORY_READ',
  ]);
  await login(page);
  await page.goto('/terceros');
  const nav = sidebar(page).locator('nav');
  await expect(nav.locator('a')).toHaveCount(18);
  await expect(nav).toHaveCSS('scrollbar-width', 'none');
  expect(await nav.evaluate((el) => getComputedStyle(el, '::-webkit-scrollbar').display)).toBe('none');
  const activeStyle = await nav
    .getByRole('link', { name: 'Terceros y AVL', exact: true })
    .evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        color: style.color,
        background: style.backgroundColor,
        border: style.borderLeftColor,
      };
    });
  expect(activeStyle).toEqual({
    color: 'rgb(212, 175, 55)',
    background: 'rgb(42, 36, 18)',
    border: 'rgb(212, 175, 55)',
  });
  await nav.getByRole('link', { name: 'Terceros y AVL', exact: true }).focus();
  await page.locator('h1').focus();
  await page.screenshot({ path: info.outputPath('menu-dorado-minimizado.png') });
  await sidebar(page).getByRole('button', { name: 'Expandir menú lateral' }).click();
  await expect.poll(async () => (await sidebar(page).boundingBox())!.width).toBe(280);
  const toggle = sidebar(page).getByRole('button', { name: 'Minimizar menú lateral' });
  await expect(toggle).toHaveText('');
  await expect(toggle.locator('tc-icon')).toBeVisible();
  await toggle.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Minimizar menú lateral');
  await toggle.focus();
  await page.keyboard.press('Escape');
  const region = (await nav.boundingBox())!;
  await page.mouse.move(region.x + region.width / 2, region.y + region.height / 2);
  const scrollBeforeWheel = await nav.evaluate((el) => el.scrollTop);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => nav.evaluate((el) => el.scrollTop)).toBeGreaterThan(scrollBeforeWheel);
  await page.locator('h1').focus();
  const inventory = nav.getByRole('link', { name: 'Inventario y patios', exact: true });
  await inventory.focus();
  await expect(inventory).toBeFocused();
  const last = (await inventory.boundingBox())!;
  expect(last.y).toBeGreaterThanOrEqual(region.y - 1);
  expect(last.y + last.height).toBeLessThanOrEqual(region.y + region.height + 1);
  await page.locator('h1').focus();
  await page.mouse.move(700, 100);
  await page.screenshot({ path: info.outputPath('menu-dorado-expandido.png') });
  const account = sidebar(page).getByRole('link', { name: 'Mi cuenta', exact: true });
  await account.click();
  await expect(account).toHaveAttribute('aria-current', 'page');
  await expect(nav.locator('a[aria-current="page"]')).toHaveCount(0);
  expect(
    await account.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        color: style.color,
        background: style.backgroundColor,
        border: style.borderLeftColor,
      };
    }),
  ).toEqual(activeStyle);
  await page.screenshot({ path: info.outputPath('menu-dorado-mi-cuenta.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir navegación' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: info.outputPath('menu-dorado-movil.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir navegación' })).toBeFocused();
});
