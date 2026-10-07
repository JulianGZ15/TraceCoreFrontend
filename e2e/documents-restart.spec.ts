import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
test('document versions, provenance, UUID replay and original bytes survive complete Core restart', async ({
  page,
}) => {
  test.skip(!process.env['TRACECORE_E2E_ISOLATED'], 'Disposable API only');
  const data = JSON.parse(
    await fs.readFile(process.env['TRACECORE_E2E_DOCUMENT_RECOVERY_FILE']!, 'utf8'),
  );
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let password = process.env['TRACECORE_ADMIN_PASSWORD']!;
  let auth = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  if (auth.status() === 401) {
    password = 'IsolatedChanged123!';
    auth = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  }
  expect(auth.ok()).toBe(true);
  const headers = { Authorization: 'Bearer ' + (await auth.json()).accessToken };
  const summary = await page.request.get('/api/v1/documents/' + data.documentUuid + '/summary', {
    headers,
  });
  expect(summary.ok()).toBe(true);
  const s = await summary.json();
  expect(s.current.metadata.uuid).toBe(data.versionUuid);
  expect(s.latest.metadata.source.kind).toBe('PARTY');
  const replay = await page.request.post('/api/v1/documents', { headers, data: data.payload });
  expect(replay.ok()).toBe(true);
  expect((await replay.json()).uuid).toBe(data.documentUuid);
  const imported = await page.request.post('/api/v1/documents/' + data.documentUuid + '/imports', {
    headers,
    data: { ...data.importPayload, documentVersion: 0 },
  });
  expect(imported.ok()).toBe(true);
  expect((await imported.json()).uuid).toBe(data.importedUuid);
  for (const id of [data.versionUuid, data.importedUuid]) {
    const content = await page.request.get('/api/v1/documents/versions/' + id + '/content', {
      headers,
    });
    expect(content.ok()).toBe(true);
    expect(
      createHash('sha256')
        .update(await content.body())
        .digest('hex'),
    ).toBe(data.hash);
  }
});
