import { Page, expect } from '@playwright/test';
import fs from 'node:fs/promises';
export async function qualityLive(page: Page) {
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let password = process.env['TRACECORE_ADMIN_PASSWORD']!;
  let response = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  if (response.status() === 401) {
    password = 'IsolatedChanged123!';
    response = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  }
  expect(response.ok()).toBe(true);
  const login = await response.json(),
    headers = { Authorization: 'Bearer ' + login.accessToken };
  const get = async (path: string) => {
    const r = await page.request.get('/api/v1/quality' + path, { headers });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  };
  const post = async (path: string, data: unknown, key?: string) => {
    const r = await page.request.post('/api/v1/quality' + path, {
      headers: { ...headers, ...(key ? { 'Idempotency-Key': key } : {}) },
      data,
    });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  };
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/inicio/);
  const asset = (await get('/assets?search=REAL-INV-01'))[0];
  expect(asset).toBeTruthy();
  const issuer = (await get('/party-options?limit=100'))[0].uuid;
  await page.goto('/calidad/evidencias');
  await page.getByLabel('Archivo PDF, PNG o JPEG · máximo 10 MiB').setInputFiles({
    name: 'Calidad-real.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nReal isolated quality evidence\n%%EOF'),
  });
  await page.getByRole('button', { name: 'Cargar evidencia', exact: true }).click();
  await expect(page.getByText('Calidad-real.pdf', { exact: true })).toBeVisible();
  await expect
    .poll(async () =>
      (await get('/evidence?limit=100')).some((v: any) => v.fileName === 'Calidad-real.pdf'),
    )
    .toBe(true);
  const evidence = (await get('/evidence?limit=100')).find(
    (v: any) => v.fileName === 'Calidad-real.pdf',
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click();
  expect((await download).suggestedFilename()).toBe('Calidad-real.pdf');
  await page.goto('/calidad/estandares');
  await page.getByRole('button', { name: 'Nuevo estándar', exact: true }).click();
  let d = page.getByRole('dialog');
  await d.getByLabel('Organización', { exact: true }).fill('TEST');
  await d.getByLabel('Código', { exact: true }).fill('QUALITY_REAL_STD');
  await d.getByLabel('Edición', { exact: true }).fill('2026');
  await d.getByLabel('Título', { exact: true }).fill('Controles manuales reales');
  await d.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(d).toHaveCount(0);
  const standard = (await get('/standards?limit=100')).find(
    (v: any) => v.code === 'QUALITY_REAL_STD',
  );
  const policy = await post('/policies', {
    modelUuid: asset.modelUuid,
    categoryUuid: null,
    standardUuid: standard.uuid,
    revision: 'A',
    method: 'VISUAL_REAL',
    calendarDays: 365,
    hourInterval: '999999999999.999999',
    requireMtr: true,
    requireCertification: false,
    validFrom: '2000-01-01T00:00:00Z',
    validTo: null,
    criteria: [
      {
        parameter: 'TEMPERATURE',
        unit: 'CELSIUS',
        minimum: '-999999999999.999999',
        maximum: '999999999999.999999',
      },
    ],
  });
  await page.goto('/calidad/politicas/' + policy.uuid);
  await expect(page.getByLabel('Intervalo de horas (decimal exacto)')).toHaveValue(
    '999999999999.999999',
  );
  await expect(page.getByLabel('Mínimo exacto')).toHaveValue('-999999999999.999999');
  await page.getByLabel('Revisión', { exact: true }).fill('B');
  await page.getByLabel('Intervalo de horas (decimal exacto)').fill('');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(async () => (await get('/policies/' + policy.uuid)).revision).toBe('B');
  await page.reload();
  async function transition(name: string, reason: string) {
    await page.getByRole('button', { name, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Motivo / dictamen documentado').fill(reason);
    await dialog.getByLabel('Referencia de evidencia (UUID)').fill(evidence.uuid);
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }
  await transition('Aprobar borrador', 'Política revisada');
  expect((await get('/policies/' + policy.uuid)).state).toBe('APPROVED');
  await page.goto('/calidad/mtrs');
  await page.getByRole('button', { name: 'Nuevo MTR', exact: true }).click();
  d = page.getByRole('dialog');
  await d.locator('tc-quality-option').getByLabel('UUID seleccionado').fill(issuer);
  await d.getByLabel('Folio', { exact: true }).fill('MTR_REAL');
  await d.getByLabel('Tipo documental', { exact: true }).fill('MTR');
  await d.getByLabel('Revisión', { exact: true }).fill('A');
  await d.getByLabel('Emisión con desplazamiento UTC').fill('2026-01-01T00:00:00Z');
  await d.getByLabel('Referencia de evidencia (UUID)').fill(evidence.uuid);
  await d.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page).toHaveURL(/calidad\/mtrs\//);
  const mtrId = page.url().split('/').at(-1)!;
  async function link() {
    await page
      .locator('tc-quality-option')
      .filter({ has: page.getByText('Pieza', { exact: true }) })
      .getByLabel('UUID seleccionado')
      .fill(asset.uuid);
    await page.getByRole('button', { name: 'Vincular pieza / traza', exact: true }).click();
    await expect
      .poll(
        async () =>
          (await get('/mtrs/' + mtrId + '/assets')).filter((v: any) => !v.withdrawnAt).length,
      )
      .toBe(1);
  }
  await link();
  await transition('Retirar vínculo', 'Destino corregido');
  await expect(page.getByText('Destino corregido', { exact: true })).toBeVisible();
  await link();
  await transition('Verificar', 'Evidencia y alcance revisados');
  expect((await get('/mtrs/' + mtrId)).state).toBe('VERIFIED');
  async function inspect() {
    await page.goto('/calidad/inspecciones/nueva?assetUuid=' + asset.uuid);
    const e = page.locator('tc-quality-inspection-editor');
    await e.locator('tc-quality-option').nth(1).getByLabel('UUID seleccionado').fill(policy.uuid);
    await e
      .locator('tc-quality-option')
      .nth(2)
      .getByLabel('UUID seleccionado')
      .fill(login.user.uuid);
    await e.getByLabel('Fecha programada con desplazamiento UTC').fill(new Date().toISOString());
    await e.getByLabel('Instalación', { exact: true }).fill('Taller real');
    await e.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page).toHaveURL(/calidad\/inspecciones\/[a-f0-9-]{36}$/);
    const id = page.url().split('/').at(-1)!;
    await page.getByRole('link', { name: 'Registrar resultados', exact: true }).click();
    await page.getByLabel('Realizada en (con desplazamiento UTC)').fill(new Date().toISOString());
    await page.getByLabel('Hallazgos', { exact: true }).fill('Inspección manual completa');
    await page.getByLabel('Referencia de evidencia (UUID)').fill(evidence.uuid);
    await page.getByLabel('Valor decimal exacto').fill('5.000001');
    await page.getByRole('button', { name: 'Registrar resultados', exact: true }).click();
    await expect(page).toHaveURL('/calidad/inspecciones/' + id);
    await transition('Aprobar', 'Resultados dentro de límites');
    expect((await get('/inspections/' + id)).state).toBe('APPROVED');
    return id;
  }
  const inspection = await inspect();
  await page.goto('/calidad/equipos/' + asset.uuid + '/certificaciones');
  await page.getByRole('button', { name: 'Nuevo registro', exact: true }).click();
  d = page.getByRole('dialog');
  await d.locator('tc-quality-option').nth(0).getByLabel('UUID seleccionado').fill(standard.uuid);
  await d.getByLabel('Inspección aprobada (UUID)').fill(inspection);
  await d.locator('tc-quality-option').nth(1).getByLabel('UUID seleccionado').fill(issuer);
  await d.getByLabel('Folio', { exact: true }).fill('CERT_REAL');
  await d.getByLabel('Alcance', { exact: true }).fill('Pieza inspeccionada');
  await d.getByLabel('Emisión con desplazamiento UTC').fill(new Date().toISOString());
  await d
    .getByLabel('Vencimiento con desplazamiento UTC')
    .fill(new Date(Date.now() + 86400000).toISOString());
  await d.getByLabel('Referencia de evidencia (UUID)').fill(evidence.uuid);
  await d.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(d).toHaveCount(0);
  await page.goto('/calidad/equipos/' + asset.uuid + '/liberaciones');
  await page.getByRole('button', { name: 'Nuevo registro', exact: true }).click();
  d = page.getByRole('dialog');
  await d
    .getByLabel('Fin obligatorio con desplazamiento UTC')
    .fill(new Date(Date.now() + 3600000).toISOString());
  await d.getByLabel('Referencia de evidencia (UUID)').fill(evidence.uuid);
  await d.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(d).toHaveCount(0);
  let releases = await get('/releases?assetUuid=' + asset.uuid);
  expect(releases[0].record.effective).toBe(true);
  expect((await get('/assets/' + asset.uuid + '/readiness'))[0].dispatchReleased).toBe(false);
  await page.goto('/calidad/mantenimiento/nuevo?assetUuid=' + asset.uuid);
  const e = page.locator('tc-quality-maintenance-editor');
  await e.getByLabel('Motivo', { exact: true }).fill('Mantenimiento real');
  await e.getByLabel('Fecha programada con desplazamiento UTC').fill(new Date().toISOString());
  await e.locator('tc-quality-option').nth(1).getByLabel('UUID seleccionado').fill(login.user.uuid);
  await e.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page).toHaveURL(/calidad\/mantenimiento\/[a-f0-9-]{36}$/);
  const orderId = page.url().split('/').at(-1)!;
  await page.getByRole('button', { name: 'Agregar tarea', exact: true }).click();
  d = page.getByRole('dialog');
  await d.getByLabel('Código', { exact: true }).fill('SEAL');
  await d.getByLabel('Descripción', { exact: true }).fill('Sello');
  await d.getByLabel('Requisitos', { exact: true }).fill('Procedimiento');
  await d.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(d).toHaveCount(0);
  await page.getByRole('button', { name: 'Corregir definición', exact: true }).click();
  d = page.getByRole('dialog');
  await d.getByLabel('Descripción', { exact: true }).fill('Sello corregido');
  await d.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(d).toHaveCount(0);
  await transition('Iniciar orden', 'Orden con evidencia');
  await transition('Completar tarea', 'Tarea completada');
  await transition('Terminar orden', 'Orden finalizada');
  expect((await get('/maintenance/' + orderId)).state).toBe('COMPLETED');
  expect((await get('/assets/' + asset.uuid + '/summary')).condition).toBe('UNKNOWN');
  await inspect();
  await page.goto('/calidad/equipos/' + asset.uuid + '/retenciones');
  await transition('Cerrar retención', 'Reinspección aprobada posterior');
  expect((await get('/holds?assetUuid=' + asset.uuid))[0].record.closedAt).toBeTruthy();
  releases = await get('/releases?assetUuid=' + asset.uuid);
  expect(releases[0].record.effective).toBe(false);
  const key = crypto.randomUUID(),
    payload = {
      assetUuid: asset.uuid,
      policyUuid: policy.uuid,
      scheduledAt: new Date().toISOString(),
      inspectorUuid: login.user.uuid,
      facility: 'Persistent receipt',
    };
  const cross = await page.evaluate(
    async ({ url, headers, data }) => {
      const r = await fetch(url + '/api/v1/quality/inspections', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return r.status;
    },
    {
      url: process.env['TRACECORE_E2E_API_URL']!,
      headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() },
      data: { ...payload, facility: 'Browser CORS preflight' },
    },
  );
  expect(cross).toBe(201);
  const created = await post('/inspections', payload, key);
  await post('/inspections/' + created.uuid + '/cancel', {
    version: created.version,
    reason: 'Cancelada antes de reinicio',
  });
  if (process.env['TRACECORE_E2E_RECOVERY_FILE'])
    await fs.writeFile(
      process.env['TRACECORE_E2E_RECOVERY_FILE']!,
      JSON.stringify({ key, payload, uuid: created.uuid }),
    );
}
