import { test, expect } from '@playwright/test';
import { qualityFixture, qids } from './quality-fixture';
import { login, expectNoPageOverflow, ids } from './api-fixture';
test('selector de trazas pagina y conserva selección fuera de la página', async ({ page }) => {
  await qualityFixture(page);
  await page.route('**/api/v1/quality/assets/*/material-traces*', async (route) => {
    const offset = Number(new URL(route.request().url()).searchParams.get('offset') ?? 0);
    await route.fulfill({
      json: Array.from({ length: offset === 0 ? 25 : 1 }, (_, i) => ({
        uuid: `20000000-0000-4000-8000-${String(offset + i + 1).padStart(12, '0')}`,
        position: `POS-${offset + i + 1}`,
        heatNumber: 'COLADA-A',
        heatUuid: ids.role,
        version: 0,
      })),
    });
  });
  await login(page);
  await page.goto('/calidad/mtrs/' + qids.mtr);
  const piece = page
    .locator('tc-quality-option')
    .filter({ has: page.getByText('Pieza', { exact: true }) });
  await piece.getByRole('button', { name: /QUALITY-ROOT-01/ }).click();
  const trace = page
    .locator('tc-quality-option')
    .filter({ has: page.getByText('Traza de material (opcional)', { exact: true }) });
  await trace.getByRole('button', { name: 'POS-1 · COLADA-A', exact: true }).click();
  await trace.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(trace.getByRole('button', { name: 'POS-26 · COLADA-A', exact: true })).toBeVisible();
  await expect(trace.getByLabel('UUID seleccionado')).toHaveValue(
    '20000000-0000-4000-8000-000000000001',
  );
  await expect(trace.getByRole('button', { name: 'Buscar', exact: true })).toHaveCount(0);
});
test('directorio por patio sin permisos de catálogo y evidencias centralizadas', async ({
  page,
}) => {
  await qualityFixture(page, 'yard');
  await login(page);
  await page.goto('/calidad/equipos');
  await expect(page.getByRole('link', { name: 'Abrir expediente' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Evidencias', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Abrir expediente' }).click();
  await expect(
    page.getByRole('heading', { name: 'Preparación técnica por miembro' }),
  ).toBeVisible();
  await page.goto('/calidad/evidencias');
  await expect(page).toHaveURL(/sin-acceso/);
});
test('lector no recibe acciones de mantenimiento ni aprobación', async ({ page }) => {
  await qualityFixture(page, 'reader');
  await login(page);
  await page.goto('/calidad/mtrs/' + qids.mtr);
  await expect(page.getByRole('button', { name: 'Corregir documento' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Verificar', exact: true })).toHaveCount(0);
  await page.goto('/calidad/inspecciones');
  await expect(page.getByRole('link', { name: 'Programar inspección' })).toHaveCount(0);
});
test('política conserva intervalos decimales y borrador ante 409', async ({ page }) => {
  const f = await qualityFixture(page);
  await login(page);
  await page.goto('/calidad/politicas/' + qids.policy);
  await expect(page.getByLabel('Intervalo de horas (decimal exacto)')).toHaveValue(
    '999999999999.999999',
  );
  await page.getByLabel('Revisión', { exact: true }).fill('B');
  f.conflict = true;
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByLabel('Revisión', { exact: true })).toHaveValue('B');
  await expect(page.getByText('Conservamos el borrador.', { exact: false })).toBeVisible();
  expect(f.requests.at(-1)?.body.hourInterval).toBe('999999999999.999999');
  expect(f.requests.at(-1)?.body.criteria[0].minimum).toBe('-999999999999.999999');
});
test('inspección conserva clave y permite conciliar después de respuesta perdida', async ({
  page,
}) => {
  const f = await qualityFixture(page);
  await login(page);
  await page.goto('/calidad/inspecciones/nueva?assetUuid=' + qids.asset);
  const editor = page.locator('tc-quality-inspection-editor');
  await editor
    .locator('tc-quality-option')
    .nth(1)
    .getByRole('button', { name: /VISUAL/ })
    .click();
  await editor
    .locator('tc-quality-option')
    .nth(2)
    .getByRole('button', { name: 'Responsable documental' })
    .click();
  await page
    .getByLabel('Fecha programada con desplazamiento UTC')
    .fill('2026-10-05T10:00:00-06:00');
  await page.getByLabel('Instalación', { exact: true }).fill('Taller real');
  f.loseResponse = true;
  await editor.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Solicitudes pendientes de confirmación' }),
  ).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('tracecore.quality.pending')!),
  );
  expect(stored[0].key).toBe(f.requests.at(-1)?.key);
  expect(stored[0].payload.scheduledAt).toBe('2026-10-05T16:00:00Z');
  await page.reload();
  await page.getByRole('button', { name: 'Consultar resultado', exact: true }).click();
  await expect(page.getByText('Resultado confirmado: ' + qids.inspection)).toBeVisible();
  expect(f.requests.filter((r) => r.path === '/inspections')).toHaveLength(1);
});
test('los vínculos MTR retirados permanecen visibles sin acciones de restauración', async ({
  page,
}) => {
  await qualityFixture(page);
  await login(page);
  await page.goto('/calidad/mtrs/' + qids.mtr);
  await expect(page.getByText('Destino incorrecto', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retirar vínculo', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Restaurar/ })).toHaveCount(0);
});
test('resultado manual envía decimal exacto y criterio congelado', async ({ page }) => {
  const f = await qualityFixture(page);
  await login(page);
  await page.goto('/calidad/inspecciones/' + qids.inspection + '/resultados');
  await page.getByLabel('Realizada en (con desplazamiento UTC)').fill('2026-10-05T10:00:00-06:00');
  await page.getByLabel('Hallazgos', { exact: true }).fill('Revisión manual completa');
  await page.getByLabel('Referencia de evidencia (UUID)').fill(qids.evidence);
  await page.getByLabel('Valor decimal exacto').fill('-123.000001');
  await page.getByRole('button', { name: 'Registrar resultados', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(qids.inspection + '$'));
  expect(f.requests.at(-1)?.body.measurements[0]).toEqual({
    parameter: 'TEMPERATURE',
    unit: 'CELSIUS',
    value: '-123.000001',
  });
});
test('descarte confirmado al salir de un formulario modificado', async ({ page }) => {
  await qualityFixture(page);
  await login(page);
  await page.goto('/calidad/politicas/nueva');
  await page.getByLabel('Revisión', { exact: true }).fill('Borrador');
  await page.getByRole('link', { name: 'Inspecciones', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Descartar cambios', exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL(/politicas\/nueva$/);
  await expect(page.getByLabel('Revisión', { exact: true })).toHaveValue('Borrador');
});
test('directorio, agenda, expediente, formulario, resultados, archivo y diálogo sin recortes', async ({
  page,
}, info) => {
  await qualityFixture(page);
  await login(page);
  const routes = {
    directorio: '/calidad/equipos',
    agenda: '/calidad/inspecciones',
    expediente: '/calidad/equipos/' + qids.asset + '/resumen',
    formulario: '/calidad/politicas/nueva',
    resultados: '/calidad/inspecciones/' + qids.inspection + '/resultados',
    mtr: '/calidad/mtrs/' + qids.mtr,
    mantenimiento: '/calidad/mantenimiento/' + qids.order,
    evidencias: '/calidad/evidencias',
  };
  for (const width of [390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, url] of Object.entries(routes)) {
      await page.goto(url);
      await expect(page.locator('tc-page-heading h1').first()).toBeVisible();
      await expect(page.getByText('Cargando…', { exact: true })).toHaveCount(0);
      await expectNoPageOverflow(page);
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.tagName !== 'BODY')).toBe(true);
      await page.screenshot({ path: info.outputPath(name + '-' + width + '.png'), fullPage: true });
      if (name === 'mtr') {
        await page.getByRole('button', { name: 'Corregir documento' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expectNoPageOverflow(page);
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Guardar', exact: true })
          .scrollIntoViewIfNeeded();
        await expect(
          page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }),
        ).toBeVisible();
        await page.screenshot({
          path: info.outputPath('dialogo-' + width + '.png'),
          fullPage: true,
        });
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Cancelar', exact: true })
          .click();
      }
    }
  }
});

test('exactos ausentes bloquean edición y pendientes se limpian al cerrar sesión', async ({
  page,
}) => {
  const f = await qualityFixture(page);
  f.missingExact = true;
  await login(page);
  await page.goto('/calidad/politicas/' + qids.policy);
  await expect(page.getByText('Backend incompatible', { exact: false }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
  await page.evaluate(() =>
    sessionStorage.setItem(
      'tracecore.quality.pending',
      '[{"actor":"previous","key":"pending","resource":"inspections","payload":{}}]',
    ),
  );
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/login/);
  expect(await page.evaluate(() => sessionStorage.getItem('tracecore.quality.pending'))).toBeNull();
});
