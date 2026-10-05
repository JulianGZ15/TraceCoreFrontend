import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
test('commercial UUID and requestKey recovery survive Core restart', async ({ request }) => {
  test.skip(process.env['TRACECORE_E2E_RECOVERY'] !== 'true', 'Requires isolated runner.');
  const saved = JSON.parse(
    await fs.readFile(process.env['TRACECORE_E2E_COMMERCE_RECOVERY_FILE']!, 'utf8'),
  );
  let login = await request.post('/api/v1/auth/login', {
    data: {
      email: process.env['TRACECORE_ADMIN_EMAIL'],
      password: process.env['TRACECORE_ADMIN_PASSWORD'],
    },
  });
  if (login.status() === 401)
    login = await request.post('/api/v1/auth/login', {
      data: { email: process.env['TRACECORE_ADMIN_EMAIL'], password: 'IsolatedChanged123!' },
    });
  expect(login.ok()).toBe(true);
  const headers = { Authorization: 'Bearer ' + (await login.json()).accessToken };
  for (const [op, key, expected] of [
    ['ORDER', saved.orderUuid, saved.orderUuid],
    ['LINE', saved.lineUuid, saved.lineUuid],
    ['BILLING', saved.billingKey, saved.billingUuid],
  ]) {
    const r = await request.get('/api/v1/commercial/requests/' + key + '?operation=' + op, {
      headers,
    });
    expect(r.ok(), await r.text()).toBe(true);
    const v = await r.json();
    expect(v.order?.uuid ?? v.uuid).toBe(expected);
    if (op === 'LINE') expect(v.concept).toBe(saved.concept);
  }
  const again = await request.post('/api/v1/commercial/orders', { headers, data: saved.payload });
  expect(again.ok()).toBe(true);
  expect((await again.json()).uuid).toBe(saved.orderUuid);
  const count = await request.get(
    '/api/v1/commercial/orders/directory?yardUuid=' + saved.payload.yardUuid + '&search=OR-LIVE',
    { headers },
  );
  expect((await count.json()).filter((x: any) => x.record.uuid === saved.orderUuid)).toHaveLength(
    1,
  );
});
