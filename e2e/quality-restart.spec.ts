import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
test('recibo de calidad persiste tras reiniciar la API y devuelve la entidad actual', async ({
  request,
}) => {
  test.skip(process.env['TRACECORE_E2E_RECOVERY'] !== 'true', 'Solo mediante ejecutor aislado.');
  const saved = JSON.parse(await fs.readFile(process.env['TRACECORE_E2E_RECOVERY_FILE']!, 'utf8'));
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let response = await request.post('/api/v1/auth/login', {
    data: { email, password: process.env['TRACECORE_ADMIN_PASSWORD'] },
  });
  if (response.status() === 401)
    response = await request.post('/api/v1/auth/login', {
      data: { email, password: 'IsolatedChanged123!' },
    });
  expect(response.ok()).toBe(true);
  const headers = {
    Authorization: 'Bearer ' + (await response.json()).accessToken,
    'Idempotency-Key': saved.key,
  };
  const receipt = await request.get('/api/v1/quality/requests/' + saved.key, { headers });
  expect(receipt.status()).toBe(200);
  expect((await receipt.json()).resourceUuid).toBe(saved.uuid);
  const repeated = await request.post('/api/v1/quality/inspections', {
    headers,
    data: saved.payload,
  });
  expect(repeated.status()).toBe(200);
  expect((await repeated.json()).uuid).toBe(saved.uuid);
  expect((await repeated.json()).state).toBe('CANCELLED');
  const changed = await request.post('/api/v1/quality/inspections', {
    headers,
    data: { ...saved.payload, facility: 'Changed' },
  });
  expect(changed.status()).toBe(409);
});
