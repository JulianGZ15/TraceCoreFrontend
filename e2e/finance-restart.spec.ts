import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
test('financial UUID, previews and evidence survive a complete Core restart', async ({ page }) => {
  test.skip(!process.env['TRACECORE_E2E_ISOLATED'], 'Disposable API only');
  const data = JSON.parse(
    await fs.readFile(process.env['TRACECORE_E2E_FINANCE_RECOVERY_FILE']!, 'utf8'),
  );
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let password = process.env['TRACECORE_ADMIN_PASSWORD']!;
  let login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  if (login.status() === 401) {
    password = 'IsolatedChanged123!';
    login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  }
  expect(login.ok()).toBe(true);
  const headers = { Authorization: 'Bearer ' + (await login.json()).accessToken };
  const recover = await page.request.get(
    '/api/v1/finance/requests/' + data.invoiceUuid + '?operation=INVOICE',
    { headers },
  );
  expect(recover.ok()).toBe(true);
  expect((await recover.json()).invoice.uuid).toBe(data.invoiceUuid);
  const replay = await page.request.post('/api/v1/finance/invoices', {
    headers,
    data: { ...data.invoicePayload, expectedCalculationFingerprint: 'obsolete' },
  });
  expect(replay.ok()).toBe(true);
  expect((await replay.json()).invoice.state).toBe('POSTED');
  expect((await replay.json()).balanceExact).toBe('96.00');
  const file = await page.request.get(
    '/api/v1/finance/evidence/' + data.evidenceUuid + '/content',
    { headers },
  );
  expect(file.ok()).toBe(true);
});
