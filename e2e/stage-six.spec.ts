import { test, expect } from '@playwright/test';
import { fixtureApi, ids, login, expectNoPageOverflow } from './api-fixture';
const commandId = '60000000-0000-4000-8000-000000000001';
async function rfidFixture(page: any) {
  const f = await fixtureApi(page);
  let requests = 0;
  const asset = {
    identity: {
      uuid: ids.role,
      internalCode: 'RFID-ROOT-01',
      serialNumber: 'SN-01',
      lifecycle: 'REGISTERED',
      yardUuid: ids.yard,
      sheetUuid: ids.permission,
      sheetRevision: 'A',
      categoryCode: 'GENERAL',
      modelCode: 'MODEL-A',
      condition: 'UNKNOWN',
    },
    binding: null,
  };
  await page.route('**/api/v1/**', async (route: any) => {
    const p = new URL(route.request().url()).pathname.replace('/api/v1', '');
    const answer = (json: any) => route.fulfill({ json });
    if (p === '/auth/context')
      return answer({
        company: f.company,
        companyPermissions: ['RFID_READ', 'RFID_TAG_MANAGE', 'RFID_SCAN', 'RFID_DEVICE_MANAGE'],
        yards: f.yards.map((y) => ({ ...y, permissions: [] })),
      });
    if (!p.startsWith('/rfid')) return route.fallback();
    if (p === '/rfid/assets') return answer([asset]);
    if (p.endsWith('/summary')) return answer(asset);
    if (p.endsWith('/status')) {
      requests++;
      return answer({
        authorization: {
          version: 0,
          createdAt: '2026-10-01T12:00:00Z',
          data: {
            uuid: commandId,
            state: 'AUTHORIZED',
            result: null,
            confirmedAssignment: null,
            command: {
              uuid: commandId,
              assetUuid: ids.role,
              tagUuid: ids.permission,
              readerUuid: ids.user,
              deviceUuid: ids.admin,
              type: 'WRITE_EPC',
              expectedEpc: '00000000000000000000000000000005',
              expectedTid: 'E20000112233',
              expiresAt: '2026-10-06T12:00:00Z',
            },
          },
        },
        execution: { available: true, rows: [{ state: 'UNKNOWN' }] },
        delivery: { available: false, rows: [] },
      });
    }
    if (p === '/rfid/readers') return answer({ available: false, rows: [] });
    return answer([]);
  });
  return () => requests;
}
test('uncertain programming never exposes confirmation or automatic physical retry', async ({
  page,
}) => {
  const calls = await rfidFixture(page);
  await login(page);
  await page.goto('/rfid/comandos/' + commandId);
  await expect(page.getByText('00000000000000000000000000000005')).toBeVisible();
  await expect(page.getByText(/Escritura incierta/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Confirmar vinculación/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Preparar inspección' })).toBeVisible();
  const before = calls();
  await page.goto('/inicio');
  await page.waitForTimeout(5100);
  expect(calls()).toBe(before);
});
for (const width of [390, 768, 1280, 1440])
  test('RFID responsive ' + width, async ({ page }, info) => {
    await rfidFixture(page);
    await login(page);
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, path] of [
      ['directory', '/rfid/equipos'],
      ['command', '/rfid/comandos/' + commandId],
      ['unavailable', '/rfid/lectores'],
    ]) {
      await page.goto(path);
      await expect(page.locator('tc-page-heading')).toBeVisible();
      await expectNoPageOverflow(page);
      await page.screenshot({ path: info.outputPath(name + '-' + width + '.png'), fullPage: true });
    }
  });
