import { Page, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function documentsLive(page: Page) {
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let password = process.env['TRACECORE_ADMIN_PASSWORD']!;
  let auth = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  if (auth.status() === 401) {
    password = 'IsolatedChanged123!';
    auth = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  }
  expect(auth.ok()).toBe(true);
  const headers = { Authorization: 'Bearer ' + (await auth.json()).accessToken };
  const get = async (path: string) => {
    const r = await page.request.get('/api/v1' + path, { headers });
    expect(r.ok(), path + ' ' + (await r.text())).toBe(true);
    return r.json();
  };
  const post = async (path: string, data: unknown) => {
    const r = await page.request.post('/api/v1' + path, { headers, data });
    expect(r.ok(), path + ' ' + (await r.text())).toBe(true);
    return r.json();
  };
  const owner = await post('/parties', {
    legalName: 'Documentos etapa10 API real',
    tradeName: null,
    country: 'MX',
    active: true,
  });
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/inicio$/);
  await page.goto('/documentos');
  await page.getByRole('button', { name: 'Nuevo documento', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Título', { exact: true }).fill('Expediente documental API real');
  await dialog.getByLabel('UUID del propietario').fill(owner.uuid);
  await dialog.getByRole('button', { name: 'Crear documento' }).click();
  await expect(page.getByRole('heading', { name: 'Expediente documental API real' })).toBeVisible();
  const documentUuid = page.url().match(/documentos\/([a-f0-9-]{36})/)![1];
  const payload = {
    uuid: documentUuid,
    type: 'GENERAL',
    title: 'Expediente documental API real',
    classification: 'INTERNAL',
    ownerKind: 'PARTY',
    ownerUuid: owner.uuid,
  };
  const pdf = Buffer.from('%PDF-1.4\n% TraceCore isolated evidence\n%%EOF');
  await page.getByRole('button', { name: 'Cargar nueva versión' }).click();
  dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Archivo PDF, PNG o JPEG')
    .setInputFiles({ name: 'stage-ten.pdf', mimeType: 'application/pdf', buffer: pdf });
  await dialog.getByRole('button', { name: 'Guardar versión DRAFT' }).click();
  await expect(page.getByRole('link', { name: /Versión 1 · DRAFT/ })).toBeVisible();
  const s = await get('/documents/' + documentUuid + '/summary');
  const versionUuid = s.latest.metadata.uuid;
  expect(s.current).toBeNull();
  await page.getByRole('link', { name: /Versión 1 · DRAFT/ }).click();
  await page.getByRole('button', { name: 'Aprobar versión' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Motivo').fill('Revisión real de archivo');
  await dialog.getByRole('button', { name: /^Confirmar aprobar/ }).click();
  await expect(page.getByText('APPROVED', { exact: true }).first()).toBeVisible();
  const source = await get('/documents/' + documentUuid + '/summary');
  expect(source.current.metadata.uuid).toBe(versionUuid);
  const downloaded = await page.request.get(
    '/api/v1/documents/versions/' + versionUuid + '/content',
    { headers },
  );
  expect(downloaded.ok()).toBe(true);
  expect(await downloaded.body()).toEqual(pdf);
  // Import preserves the original blob and source permissions.
  const evidenceResponse = await page.request.post('/api/v1/parties/' + owner.uuid + '/evidence', {
    headers,
    multipart: { file: { name: 'legacy.pdf', mimeType: 'application/pdf', buffer: pdf } },
  });
  expect(evidenceResponse.ok(), await evidenceResponse.text()).toBe(true);
  const evidence = await evidenceResponse.json();
  const importPayload = {
    uuid: crypto.randomUUID(),
    sourceKind: 'PARTY',
    sourceUuid: evidence.uuid,
    documentVersion: source.document.version,
  };
  await page.goto('/documentos/' + documentUuid);
  await page.getByRole('button', { name: 'Importar evidencia', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Origen', { exact: true }).selectOption('PARTY');
  await dialog.getByLabel('UUID del contexto de origen').fill(owner.uuid);
  await dialog.getByRole('button', { name: 'Consultar evidencias' }).click();
  await dialog.getByRole('button', { name: /legacy.pdf/ }).click();
  await dialog.getByRole('button', { name: 'Guardar versión DRAFT' }).click();
  await expect(dialog).toHaveCount(0);
  const imported = (await get('/documents/' + documentUuid + '/summary')).latest.metadata;
  importPayload.uuid = imported.uuid;
  expect(imported.source.kind).toBe('PARTY');
  expect((await get('/documents/' + documentUuid + '/summary')).current.metadata.uuid).toBe(
    versionUuid,
  );
  const links = await get('/documents/' + documentUuid + '/links');
  expect(links.items).toHaveLength(2);
  expect(links.items.filter((l: any) => l.view.effective)).toHaveLength(1);
  const changed = await page.request.post('/api/v1/documents', {
    headers,
    data: { ...payload, title: 'Different' },
  });
  expect(changed.status()).toBe(409);
  expect((await post('/documents', payload)).uuid).toBe(documentUuid);
  const yard = (await get('/auth/context')).yards[0];
  await page.goto('/consultas/panel?yardUuid=' + yard.uuid);
  await expect(page.getByText('Piezas identificadas')).toBeVisible();
  await page.goto('/consultas/inventario?yardUuid=' + yard.uuid);
  await expect(page.getByRole('heading', { name: 'Consulta de inventario' })).toBeVisible();
  const csv = await page.request.get(
    process.env['TRACECORE_E2E_API_URL'] +
      '/api/v1/queries/exports/inventory.csv?yardUuid=' +
      yard.uuid +
      '&limit=1',
    { headers: { ...headers, Origin: process.env['TRACECORE_E2E_FRONT_URL']! } },
  );
  expect(csv.ok()).toBe(true);
  expect(csv.headers()['access-control-expose-headers']).toContain('X-Next-Offset');
  expect((await csv.body()).subarray(0, 3)).toEqual(Buffer.from([239, 187, 191]));
  const browserCsv = await page.evaluate(
    async ({ url, authorization }) => {
      const response = await fetch(url, { headers: { Authorization: authorization } });
      const bytes = new Uint8Array(await response.arrayBuffer());
      return {
        status: response.status,
        offset: response.headers.get('X-Offset'),
        more: response.headers.get('X-Has-More'),
        generatedAt: response.headers.get('X-Generated-At'),
        prefix: Array.from(bytes.slice(0, 3)),
      };
    },
    {
      url:
        process.env['TRACECORE_E2E_API_URL'] +
        '/api/v1/queries/exports/inventory.csv?yardUuid=' +
        yard.uuid +
        '&limit=1',
      authorization: headers.Authorization,
    },
  );
  expect(browserCsv.status).toBe(200);
  expect(browserCsv.offset).toBe('0');
  expect(['true', 'false']).toContain(browserCsv.more);
  expect(browserCsv.generatedAt).toBeTruthy();
  expect(browserCsv.prefix).toEqual([239, 187, 191]);
  await page.goto('/consultas/terceros/' + owner.uuid + '/contactos');
  await page.getByRole('button', { name: 'Contactos', exact: true }).click();
  await expect(page.getByText('Sin registros autorizados para esta colección.')).toBeVisible();
  await page.goto('/soporte/auditoria?resourceType=DOCUMENT&resourceUuid=' + documentUuid);
  await expect(page.getByRole('heading', { name: 'Auditoría de soporte' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Consultar detalle' }).first()).toBeVisible();
  await fs.writeFile(
    process.env['TRACECORE_E2E_DOCUMENT_RECOVERY_FILE']!,
    JSON.stringify({
      documentUuid,
      versionUuid,
      importedUuid: imported.uuid,
      payload,
      importPayload,
      hash: createHash('sha256').update(pdf).digest('hex'),
    }),
  );
}
