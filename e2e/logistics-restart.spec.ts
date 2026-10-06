import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
test('logistics recovery and trip revisions survive Core restart', async ({ request }) => {
  test.skip(process.env['TRACECORE_E2E_RECOVERY'] !== 'true', 'Isolated runner only.');
  const saved = JSON.parse(
    await fs.readFile(process.env['TRACECORE_E2E_LOGISTICS_RECOVERY_FILE']!, 'utf8'),
  );
  const login = await request.post('/api/v1/auth/login', {
    data: { email: process.env['TRACECORE_ADMIN_EMAIL'], password: 'IsolatedChanged123!' },
  });
  expect(login.ok()).toBe(true);
  const headers = { Authorization: 'Bearer ' + (await login.json()).accessToken };
  const result = await request.get(
    '/api/v1/logistics/requests/' + saved.key + '?operation=MANIFEST',
    { headers },
  );
  expect(result.ok(), await result.text()).toBe(true);
  expect((await result.json()).uuid).toBe(saved.uuid);
  expect((await result.json()).state).toBe('DELIVERED');
  const revisions = await request.get(
    '/api/v1/logistics/manifests/' + saved.uuid + '/trip/revisions',
    { headers },
  );
  expect((await revisions.json()).length).toBe(1);
});
