import { expect, test, Page } from '@playwright/test';
import { login, expectNoPageOverflow } from './api-fixture';

const asset = '30000000-0000-0000-0000-000000000001';
const photoId = '30000000-0000-0000-0000-000000000002';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
async function fixture(page: Page, reader = false) {
  const user = { uuid: asset, name: 'Operador (DEMO)', email: 'ana@example.test', active: true, version: 0 };
  const image = { mediaType: 'image/png', width: 1, height: 1, size: png.length, sha256: 'a'.repeat(64) };
  let photo: any = { uuid: photoId, assetUuid: asset, description: 'Vista lateral del equipo de prueba con descripción extensa',
    state: 'ACTIVE', version: 0, uploadedBy: user, uploadedAt: '2026-10-20T12:00:00Z', uploadChannel: 'WEB',
    original: { ...image, filename: 'equipo.png' }, capture: { takenAtLocal: '2026-10-19T08:00:00',
      offsetMinutes: null, source: 'EXIF', exifTakenAtLocal: '2026-10-19T08:00:00', exifOffsetMinutes: null,
      cameraMake: 'Cámara (DEMO)', cameraModel: 'Prueba', originalOrientation: 1 },
    images: { master: image, preview: image, thumbnail: image }, archivedBy: null, archivedAt: null, archiveReason: null };
  const history: any[] = [{ uuid: photoId, action: 'UPLOADED', actor: user, occurredAt: photo.uploadedAt, reason: null, before: null, after: photo }];
  const writes: string[] = [];
  const profile = { asset: { uuid: asset, internalCode: 'EQ-PHOTO-DEMO', serialNumber: 'SERIE-DEMO', lifecycle: 'REGISTERED' },
    model: { code: 'MODELO-DEMO' }, category: { name: 'Equipo de prueba' }, condition: { condition: 'UNKNOWN' },
    technicalSheet: { revision: 'A', state: 'APPROVED' } };
  const pageOf = (items: any[]) => ({ items, offset: 0, limit: 25, hasMore: false, nextOffset: null });
  await page.route('**/api/v1/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.replace('/api/v1', '');
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/auth/login') return json({ accessToken: 'photo-fixture', tokenType: 'Bearer', expiresAt: new Date(Date.now() + 900000).toISOString(), user });
    if (!request.headers()['authorization']) return json({ code: 'UNAUTHORIZED' }, 401);
    if (path === '/auth/me') return json(user);
    if (path === '/auth/context') return json({ company: { uuid: asset, name: 'TraceCore (DEMO)', timezone: 'America/Mexico_City', active: true },
      companyPermissions: ['EQUIPMENT_READ', 'QUERY_READ', ...(reader ? [] : ['EQUIPMENT_MANAGE'])], yards: [] });
    if (path === '/equipment/assets/' + asset) return json(profile);
    if (path === '/queries/equipment/' + asset + '/summary') return json({ profile, sections: { photos: true }, generatedAt: photo.uploadedAt });
    if (path === '/queries/equipment/' + asset + '/sections/photos') return json({ authorized: true, collection: 'files', generatedAt: photo.uploadedAt,
      data: pageOf(photo.state === (url.searchParams.get('collection') === 'archived' ? 'ARCHIVED' : 'ACTIVE') ? [photo] : []) });
    const base = '/equipment/assets/' + asset + '/photos';
    if (path === base && request.method() === 'GET') return json(pageOf(photo.state === (url.searchParams.get('state') ?? 'ACTIVE') ? [photo] : []));
    if (path === base && request.method() === 'POST') { writes.push(path); return json(photo, 201); }
    if (path === base + '/' + photoId && request.method() === 'GET') return json(photo);
    if (path === base + '/' + photoId + '/history') return json(pageOf(history));
    if (path === base + '/' + photoId + '/content') return route.fulfill({ contentType: 'image/png', body: png,
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    if (path.startsWith(base + '/' + photoId) && request.method() !== 'GET') {
      writes.push(path); const before = photo, body = request.postDataJSON();
      const action = path.endsWith('/archive') ? 'ARCHIVED' : path.endsWith('/restore') ? 'RESTORED' : 'CORRECTED';
      photo = { ...photo, ...body, version: photo.version + 1,
        state: action === 'ARCHIVED' ? 'ARCHIVED' : action === 'RESTORED' ? 'ACTIVE' : photo.state,
        archivedBy: action === 'ARCHIVED' ? user : null, archivedAt: action === 'ARCHIVED' ? photo.uploadedAt : null,
        archiveReason: action === 'ARCHIVED' ? body.reason : null };
      history.unshift({ uuid: 'event-' + history.length, action, actor: user, occurredAt: photo.uploadedAt, reason: body.reason, before, after: photo });
      return json(photo);
    }
    return json({ code: 'NOT_FOUND' }, 404);
  });
  return { writes };
}
for (const width of [390, 768, 1280, 1440]) {
  test('galería y visor accesibles a ' + width + ' px', async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await fixture(page); await login(page);
    await page.goto('/equipos/' + asset + '/fotos');
    const open = page.getByRole('button', { name: /^Abrir foto:/ });
    await expect(open).toBeVisible();
    await expect(page.locator('.photo-open img')).toHaveJSProperty('naturalWidth', 1);
    await expectNoPageOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('gallery-' + width + '.png'), fullPage: true });
    await open.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Zona no informada', { exact: false }).first()).toBeVisible();
    await page.getByLabel('Ampliación de la foto').fill('2');
    await page.getByLabel('Motivo del cambio o archivo').fill('Foto de referencia anterior (DEMO)');
    await page.getByRole('button', { name: 'Archivar foto', exact: true }).click();
    const confirm = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Archivar foto', exact: true }) });
    await confirm.getByRole('button', { name: /Confirmar|Aceptar/ }).click();
    await expect(page.getByRole('button', { name: 'Restaurar foto', exact: true })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('viewer-' + width + '.png'), fullPage: true });
    await page.getByRole('button', { name: 'Cerrar visor de fotos' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Ver archivadas' }).click();
    await expect(open).toBeVisible();
    await page.goto('/consultas/equipos/' + asset + '/fotos');
    await page.getByRole('button', { name: 'Ver archivadas' }).click();
    await expect(open).toBeVisible();
    await expect(page.getByLabel('Seleccionar fotos para subir')).toHaveCount(0);
  });
}
test('lector consulta y usa teclado sin acciones de escritura', async ({ page }) => {
  const state = await fixture(page, true); await login(page); await page.goto('/equipos/' + asset + '/fotos');
  await expect(page.getByLabel('Seleccionar fotos para subir')).toHaveCount(0);
  const open = page.getByRole('button', { name: /^Abrir foto:/ });
  await open.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar corrección' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
  expect(state.writes).toEqual([]);
});
test('selección múltiple mantiene los resultados y permite otra carga', async ({ page }) => {
  const state = await fixture(page); await login(page); await page.goto('/equipos/' + asset + '/fotos');
  await page.getByLabel('Seleccionar fotos para subir').setInputFiles([
    { name: 'equipo-uno.png', mimeType: 'image/png', buffer: png },
    { name: 'equipo-dos.png', mimeType: 'image/png', buffer: png },
  ]);
  await page.getByRole('button', { name: 'Subir fotos pendientes' }).click();
  await expect(page.getByText('Foto guardada', { exact: true })).toHaveCount(2);
  expect(state.writes).toHaveLength(2);
});
test('archiva, restaura y corrige con motivo e historial', async ({ page }) => {
  const state = await fixture(page); await login(page); await page.goto('/equipos/' + asset + '/fotos');
  await page.getByRole('button', { name: /^Abrir foto:/ }).click();
  await page.getByLabel('Motivo del cambio o archivo').fill('Vista anterior (DEMO)');
  await page.getByRole('button', { name: 'Archivar foto', exact: true }).click();
  await page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Archivar foto', exact: true }) }).getByRole('button', { name: /Confirmar|Aceptar/ }).click();
  await expect(page.getByRole('button', { name: 'Restaurar foto', exact: true })).toBeVisible();
  await page.getByLabel('Motivo del cambio o archivo').fill('Referencia vigente (DEMO)');
  await page.getByRole('button', { name: 'Restaurar foto', exact: true }).click();
  await page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Restaurar foto', exact: true }) }).getByRole('button', { name: /Confirmar|Aceptar/ }).click();
  await expect(page.getByRole('button', { name: 'Archivar foto', exact: true })).toBeVisible();
  await page.getByLabel('Descripción (opcional)', { exact: true }).fill('Vista frontal actualizada (DEMO)');
  await page.getByLabel('Motivo del cambio o archivo').fill('Descripción más precisa (DEMO)');
  await page.getByRole('button', { name: 'Guardar corrección', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vista frontal actualizada (DEMO)' })).toBeVisible();
  await expect(page.getByText('Restauración · Operador (DEMO)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar visor de fotos' }).click();
  await expect(page.getByRole('button', { name: 'Abrir foto: Vista frontal actualizada (DEMO)' })).toBeVisible();
  expect(state.writes).toHaveLength(3);
});
