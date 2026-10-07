import { test, expect } from '@playwright/test';
import { documentsFixture, dids } from './documents-fixture';
import { login, ids, expectNoPageOverflow } from './api-fixture';
async function start(
  page: import('@playwright/test').Page,
  profile: Parameters<typeof documentsFixture>[1] = 'full',
) {
  const f = await documentsFixture(page, profile);
  await login(page);
  await expect(page).toHaveURL(/inicio|sin-acceso/);
  return f;
}
test('document creation and upload are separate; approval generates a concrete current version', async ({
  page,
}) => {
  const f = await start(page);
  await page.goto('/documentos');
  await page.getByRole('button', { name: 'Nuevo documento', exact: true }).click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Título', { exact: true }).fill('Documento creado en prueba');
  await d.getByLabel('UUID del propietario').fill(dids.owner);
  await d.getByRole('button', { name: 'Crear documento', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Documento creado en prueba' })).toBeVisible();
  expect(f.writes).toHaveLength(1);
  await page.getByRole('button', { name: 'Cargar nueva versión' }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Archivo PDF, PNG o JPEG')
    .setInputFiles({
      name: 'source.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\ncontent\n%%EOF'),
    });
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar versión DRAFT' }).click();
  await page.getByRole('link', { name: /Versión 1 · DRAFT/ }).click();
  await page.getByRole('button', { name: 'Aprobar versión' }).click();
  await page.getByRole('dialog').getByLabel('Motivo').fill('Revisión documental');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Confirmar aprobar/ })
    .click();
  await expect(page.getByText('APPROVED', { exact: true }).first()).toBeVisible();
  expect(f.writes).toHaveLength(3);
  expect(f.links.some((l) => l.role === 'PRIMARY' && l.versionUuid === f.files.at(-1).uuid)).toBe(
    true,
  );
});
test('approver without manage can review latest DRAFT; conflict keeps reason until explicit reload', async ({
  page,
}) => {
  const f = await start(page, 'approver');
  f.files[0].state = 'DRAFT';
  f.documents[0].currentVersionUuid = null;
  f.decisionConflict = true;
  await page.goto('/documentos/' + dids.document + '/versiones/' + dids.file);
  await page.getByRole('button', { name: 'Aprobar versión' }).click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Motivo').fill('Conservar motivo ante conflicto');
  await d.getByRole('button', { name: /^Confirmar aprobar/ }).click();
  await expect(d.getByLabel('Motivo')).toHaveValue('Conservar motivo ante conflicto');
  await expect(d.getByRole('button', { name: /^Confirmar aprobar/ })).toBeDisabled();
  await d.getByRole('button', { name: 'Consultar estado actual' }).click();
  await d.getByRole('button', { name: /^Confirmar aprobar/ }).click();
  expect(f.writes.at(-1)?.body.version).toBe(2);
  await expect(page.getByText('APPROVED', { exact: true }).first()).toBeVisible();
});
test('lost creation response is recovered after reload without another POST', async ({ page }) => {
  const f = await start(page);
  f.lostCreate = true;
  await page.goto('/documentos');
  await page.getByRole('button', { name: 'Nuevo documento', exact: true }).click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Título', { exact: true }).fill('Respuesta perdida');
  await d.getByLabel('UUID del propietario').fill(dids.owner);
  await d.getByRole('button', { name: 'Crear documento' }).click();
  await expect(d.getByRole('alert')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Consultar resultado', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Respuesta perdida' })).toBeVisible();
  expect(f.writes).toHaveLength(1);
});
test('reader has authenticated downloads and no management actions', async ({ page }) => {
  const f = await start(page, 'reader');
  await page.goto('/documentos/' + dids.document + '/versiones/' + dids.file);
  await expect(page.getByRole('button', { name: 'Aprobar versión' })).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar archivo' }).click();
  expect((await download).suggestedFilename()).toBe('procedure.pdf');
  expect(f.gets).toContain('/documents/versions/' + dids.file + '/content');
});
test('writer capability does not imply document read', async ({ page }) => {
  await start(page, 'writer');
  await expect(page.getByText(/necesitas DOCUMENT_READ COMPANY/)).toBeVisible();
  await page.goto('/documentos');
  await expect(page).toHaveURL(/sin-acceso/);
});
test('yard-only query access remains independent of global document and support access', async ({
  page,
}) => {
  await start(page, 'yard');
  await page.goto('/consultas/panel?yardUuid=' + ids.yard);
  await expect(page.getByText('Piezas identificadas')).toBeVisible();
  await page.goto('/documentos');
  await expect(page).toHaveURL(/sin-acceso/);
  await page.goto('/soporte');
  await expect(page).toHaveURL(/sin-acceso/);
});
test('integral dossier fetches only visited collections and hides unauthorized section payloads', async ({
  page,
}) => {
  const f = await start(page);
  await page.goto('/consultas/equipos/' + dids.asset);
  await expect(page.getByText('999999999999999.9999')).toBeVisible();
  expect(f.gets.some((p) => p.includes('/sections/'))).toBe(false);
  await page.getByRole('link', { name: 'Historia técnica' }).click();
  await page.getByRole('button', { name: 'Propiedad', exact: true }).click();
  await expect(page.getByText('Historia autorizada')).toBeVisible();
  expect(f.gets.some((p) => p.includes('/quality'))).toBe(false);
  await page.goto('/consultas/equipos/' + dids.asset + '/calidad');
  await expect(page.getByText(/No se muestran datos ni cantidades/)).toBeVisible();
});
test('CSV downloads explicit pages preserving filters and continuity headers', async ({ page }) => {
  const f = await start(page);
  await page.goto('/consultas/inventario?yardUuid=' + ids.yard + '&search=EQ');
  await expect(page.getByText('999999999999.999999')).toBeVisible();
  let d = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar primera página' }).click();
  await d;
  await expect(page.getByRole('button', { name: /Descargar siguiente página/ })).toBeVisible();
  d = page.waitForEvent('download');
  await page.getByRole('button', { name: /Descargar siguiente página/ }).click();
  await d;
  expect(f.gets.filter((p) => p.includes('/exports/'))).toHaveLength(2);
  await expect(page.getByRole('button', { name: /Descargar siguiente página/ })).toHaveCount(0);
});
test('support shows read-only receipts and audit metadata with independent filters', async ({
  page,
}) => {
  const f = await start(page);
  await page.goto('/soporte/recibos-rfid');
  await page.getByRole('button', { name: 'Consultar detalle' }).click();
  await expect(page.getByText('RESOLVED', { exact: true }).first()).toBeVisible();
  await page.goto('/soporte/auditoria');
  await page.getByRole('button', { name: 'Consultar detalle' }).click();
  await expect(page.locator('dt').filter({ hasText: 'Campos intervenidos' })).toBeVisible();
  expect(f.writes).toHaveLength(0);
});
test('late inventory responses cannot replace current filter results', async ({ page }) => {
  const f = await start(page);
  f.oldResponse = true;
  await page.goto('/consultas/inventario?yardUuid=' + ids.yard + '&search=old');
  await page.goto('/consultas/inventario?yardUuid=' + ids.yard + '&search=new');
  await expect(page.getByRole('cell', { name: /^EQ-001/ })).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.getByRole('cell', { name: /^OLD/ })).toHaveCount(0);
});
for (const width of [390, 768, 1280, 1440])
  test('stage10 visual and keyboard ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await start(page);
    const paths = [
      ['library', '/documentos'],
      ['version', '/documentos/' + dids.document + '/versiones/' + dids.file],
      ['links', '/documentos/' + dids.document + '/vinculos'],
      ['dashboard', '/consultas/panel?yardUuid=' + ids.yard],
      ['dossier', '/consultas/equipos/' + dids.asset],
      ['inventory', '/consultas/inventario?yardUuid=' + ids.yard],
      ['support', '/soporte/recibos-rfid'],
    ];
    for (const [name, path] of paths) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expect(
        page.getByText(/Consultando (biblioteca|documento|expediente|resultados|soporte)/),
      ).toHaveCount(0);
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: 'test-results/stage10-' + name + '-' + width + '.png',
        fullPage: true,
      });
    }
    await page.goto('/documentos');
    await page.getByRole('button', { name: 'Nuevo documento', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await expectNoPageOverflow(page);
    await page.screenshot({
      path: 'test-results/stage10-dialog-' + width + '.png',
      fullPage: true,
    });
    await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Nuevo documento', exact: true })).toBeFocused();
  });

test('legacy evidence selector opens and imports explicit source without duplicating file upload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const f = await start(page);
  await page.goto('/documentos/' + dids.document);
  await page.getByRole('button', { name: 'Importar evidencia', exact: true }).click();
  const d = page.getByRole('dialog');
  await expect(d.getByLabel('Origen', { exact: true }), errors.join('\n')).toBeVisible();
  await d.getByLabel('Origen', { exact: true }).selectOption('PARTY');
  await d.getByLabel('UUID del contexto de origen').fill(dids.owner);
  await d.getByRole('button', { name: 'Consultar evidencias' }).click();
  await d.getByRole('button', { name: /legacy.pdf/ }).click();
  await d.getByRole('button', { name: 'Guardar versión DRAFT' }).click();
  await expect(d).toHaveCount(0);
  expect(f.writes.at(-1)?.body.sourceKind).toBe('PARTY');
  expect(errors).toEqual([]);
});
