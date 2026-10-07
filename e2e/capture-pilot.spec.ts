import { test } from '@playwright/test';
import { login } from './api-fixture';
import { partnersFixture } from './partners-fixture';
import * as path from 'path';
import * as fs from 'fs';

const screenshotDir = 'C:\\Users\\jjgm1\\.gemini\\antigravity\\brain\\af2d4bdd-bdbf-495b-9f3a-ae3f4a9cda0c\\screenshots';

test.beforeAll(() => {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});

const viewports = [
  { width: 390, height: 844, name: '390px_mobile' },
  { width: 768, height: 1024, name: '768px_tablet' },
  { width: 1280, height: 800, name: '1280px_desktop' },
  { width: 1440, height: 900, name: '1440px_wide' },
];

for (const vp of viewports) {
  test(`capture pilot at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await partnersFixture(page);
    await login(page);

    // Navigate with active filter to show chips
    await page.goto('/terceros?role=SUPPLIER&active=true');
    await page.waitForTimeout(400);

    // Capture main view with toolbar and chips
    await page.screenshot({
      path: path.join(screenshotDir, `pilot_${vp.name}_toolbar.png`),
      fullPage: false,
    });

    // Open filter drawer
    await page.getByRole('button', { name: 'Filtros' }).click();
    await page.waitForTimeout(400);

    // Capture drawer open
    await page.screenshot({
      path: path.join(screenshotDir, `pilot_${vp.name}_drawer.png`),
      fullPage: false,
    });
  });
}
