import { test, expect } from '@playwright/test';
import { inventoryFixture } from './inventory-fixture';

test('los movimientos vinculados a manifiestos se consultan sin comandos de ejecución', async ({
  page,
}) => {
  const f = await inventoryFixture(page);
  f.state.logisticsManaged = true;
  await page.goto('/inventario/movimientos/' + f.move);
  await expect(page.getByRole('button', { name: 'Confirmar salida', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cancelar borrador', exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Este movimiento se gestiona desde logística', { exact: false }),
  ).toBeVisible();
  f.state.movement.state = 'IN_TRANSIT';
  await page.goto('/inventario/movimientos/' + f.move + '/recepcion');
  await expect(page.getByRole('button', { name: 'Confirmar recepción completa' })).toHaveCount(0);
  expect(f.state.requests).toHaveLength(0);
});

test('cambiar sección del mismo expediente confirma el descarte', async ({ page }) => {
  const f = await inventoryFixture(page);
  await page.goto('/inventario/equipos/' + f.asset + '/disponibilidad');
  await page.getByLabel('Inicio', { exact: true }).fill('2030-01-01T00:00');
  await page.getByRole('link', { name: 'Situación actual', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Descartar cambios', exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL(/disponibilidad$/);
  await expect(page.getByLabel('Inicio', { exact: true })).toHaveValue('2030-01-01T00:00');
  await page.getByRole('link', { name: 'Situación actual', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page).toHaveURL(/actual$/);
});

test('pantallas operativas mantienen contenido y foco en los cuatro tamaños', async ({
  page,
}, info) => {
  const f = await inventoryFixture(page);
  f.state.movement.state = 'IN_TRANSIT';
  const routes: Record<string, string> = {
    directorio: '/inventario/equipos',
    ubicacion: '/inventario/ubicaciones/' + f.location,
    preparacion: '/inventario/movimientos/nuevo?yardUuid=' + f.yard,
    recepcion: '/inventario/movimientos/' + f.move + '/recepcion',
    conciliacion: '/inventario/propuestas/' + f.proposal,
    conteo: '/inventario/conteos/' + f.count,
  };
  for (const width of [390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, url] of Object.entries(routes)) {
      await page.goto(url);
      await expect(page.locator('tc-page-heading h1')).toBeVisible();
      await expect(page.getByText('Cargando…', { exact: true })).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        name + ' ' + width,
      ).toBe(true);
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.tagName !== 'BODY')).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: info.outputPath(name + '-' + width + '.png'), fullPage: true });
      if (name === 'ubicacion') {
        await page.getByRole('button', { name: 'Editar', exact: true }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: info.outputPath('dialogo-' + width + '.png'),
          fullPage: true,
        });
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Cancelar', exact: true })
          .click();
      }
      if (name === 'preparacion') {
        const form = page.locator('tc-inventory-movement-plan');
        await form.getByRole('button', { name: 'Siguiente', exact: true }).last().click();
        await form.getByRole('button', { name: /ROOT-01/ }).click();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: info.outputPath('raices-' + width + '.png'),
          fullPage: true,
        });
        await form.getByRole('button', { name: 'Siguiente', exact: true }).last().click();
        await form.getByLabel('Patio', { exact: true }).selectOption(f.yard);
        await form.getByRole('button', { name: /BAY-A/ }).click();
        await form.getByLabel('Motivo', { exact: true }).fill('Preparación revisada');
        await form.getByLabel('Referencia de origen').fill('DOC-MANUAL');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: info.outputPath('destino-' + width + '.png'),
          fullPage: true,
        });
        await form.getByRole('button', { name: 'Siguiente', exact: true }).last().click();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: info.outputPath('revision-' + width + '.png'),
          fullPage: true,
        });
      }
    }
  }
});
test('operador de patio sin catálogo ni terceros: jerarquía y responsive', async ({
  page,
}, testInfo) => {
  const f = await inventoryFixture(page, true);
  for (const width of [390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/inventario/patios');
    await expect(page.getByRole('heading', { name: 'Distribución de patios' })).toBeVisible();
    await expect(
      page.getByText('Bahía de prueba con nombre largo', { exact: false }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath('patios-' + width + '.png'),
      fullPage: true,
    });
  }
  await page.goto('/inventario/equipos');
  await expect(page.getByRole('cell').filter({ hasText: 'ROOT-01' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Catálogo técnico', exact: true })).toHaveCount(0);
  await page.goto('/inventario/sitios');
  await expect(page).toHaveURL(/sin-acceso/);
});
test('preparación guiada guarda borrador y salida requiere confirmación independiente', async ({
  page,
}) => {
  const f = await inventoryFixture(page);
  await page.goto('/inventario/movimientos/nuevo?yardUuid=' + f.yard);
  const form = page.locator('tc-inventory-movement-plan');
  await form.getByRole('button', { name: 'Siguiente', exact: true }).last().click();
  await form.getByRole('button', { name: /ROOT-01/ }).click();
  await form.getByRole('button', { name: 'Siguiente', exact: true }).last().click();
  await form.getByLabel('Patio', { exact: true }).selectOption(f.yard);
  await form.getByRole('button', { name: /BAY-A/ }).click();
  await form.getByLabel('Motivo', { exact: true }).fill('Traslado documentado');
  await form.getByLabel('Referencia de origen').fill('REF-01');
  await form.getByRole('button', { name: 'Siguiente', exact: true }).last().click();
  await form.getByRole('button', { name: 'Preparar borrador' }).click();
  await expect(page).toHaveURL('/inventario/movimientos/' + f.move);
  expect(f.state.requests.filter((r) => r.path.endsWith('/dispatch'))).toHaveLength(0);
  await page.getByRole('button', { name: 'Confirmar salida', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Salida confirmada.', { exact: true })).toBeVisible();
  expect(
    f.state.requests.find((r) => r.path === '/inventory/movements')?.body['requestKey'],
  ).toMatch(/^[a-f0-9-]{36}$/);
});
test('recepción conserva declaración y clave ante conflicto', async ({ page }) => {
  const f = await inventoryFixture(page);
  f.state.movement.state = 'IN_TRANSIT';
  f.state.receiveConflict = true;
  await page.goto('/inventario/movimientos/' + f.move + '/recepcion');
  await page.getByLabel('Condición', { exact: true }).selectOption('DAMAGED');
  await page.getByLabel('Motivo', { exact: true }).fill('Daño declarado');
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Confirmar recepción completa' }).click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    if (i === 0) {
      await expect(page.getByText(/hay un conflicto/)).toBeVisible();
      await expect(page.getByLabel('Motivo', { exact: true })).toHaveValue('Daño declarado');
    }
  }
  await expect(page).toHaveURL('/inventario/movimientos/' + f.move);
  const writes = f.state.requests.filter((r) => r.path.endsWith('/receive'));
  expect(writes).toHaveLength(2);
  expect(writes[0].body).toEqual(writes[1].body);
});
test('conciliación corregida acepta conjuntos completos y registra decisión', async ({ page }) => {
  const f = await inventoryFixture(page);
  await page.goto('/inventario/propuestas/' + f.proposal);
  await page.getByLabel('Decisión', { exact: true }).selectOption('CORRECTED');
  await page.getByLabel('Aceptar conjunto completo').check();
  await page.getByLabel('Motivo obligatorio').fill('Se confirma el grupo esperado');
  await page.getByRole('button', { name: 'Registrar decisión' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Ver movimiento resultante' })).toBeVisible();
  expect(
    f.state.requests.find((r) => r.path.endsWith('/decide'))?.body['acceptedAssetUuids'],
  ).toEqual([f.asset]);
});
test('conteo conserva desconocidos y exige resolver antes de cerrar', async ({ page }) => {
  const f = await inventoryFixture(page);
  await page.goto('/inventario/conteos/' + f.count);
  await page.getByLabel('Identificador si desconocido').fill('MANUAL-UNKNOWN');
  await page.getByLabel('Referencia de observación').fill('Planilla física');
  await page.getByRole('button', { name: 'Registrar observación', exact: true }).click();
  await expect(page.getByText('MANUAL-UNKNOWN', { exact: true })).toBeVisible();
  const unresolved = page.getByRole('button', { name: 'Resolver', exact: true });
  for (let remaining = await unresolved.count(); remaining > 0; remaining--) {
    await page.getByRole('button', { name: 'Resolver', exact: true }).first().click();
    await page.getByLabel('Motivo obligatorio').fill('Variación investigada');
    await page.getByRole('button', { name: 'Guardar resolución' }).click();
    await expect(
      page.getByText('Diferencia resuelta. La resolución no ejecuta movimientos.'),
    ).toBeVisible();
    await expect(unresolved).toHaveCount(remaining - 1);
  }
  await page.getByLabel('Motivo de cierre o cancelación').fill('Diferencias revisadas');
  await page
    .getByRole('button', { name: 'Cerrar (todas las diferencias resueltas)', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Manual · Cerrado · Apertura', { exact: false })).toBeVisible();
  expect(f.state.requests.some((r) => r.path === '/inventory/movements')).toBe(false);
});
