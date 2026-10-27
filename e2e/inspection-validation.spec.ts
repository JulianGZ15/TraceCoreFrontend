import { test, expect } from '@playwright/test';
import { qualityFixture, qids } from './quality-fixture';
import { expectNoPageOverflow, login } from './api-fixture';

for (const width of [390, 768, 1280, 1440]) {
  test(`inspección explica el lugar y presenta errores accesibles a ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const state = await qualityFixture(page);
    await login(page);
    await page.goto('/calidad/inspecciones/nueva?assetUuid=' + qids.asset);
    const editor = page.locator('tc-quality-inspection-editor');
    const facility = page.getByLabel('Lugar de inspección (instalación) *', { exact: true });
    await expect(facility).toHaveAttribute('maxlength', '500');
    await expect(page.locator('#quality-inspection-facility-help')).toContainText(
      'taller, laboratorio o área de pruebas',
    );
    await editor.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(editor.locator('.tc-validation-summary')).toContainText('4 campos');
    await expect(page.locator('#quality-inspection-facility-error')).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'Política aplicable', exact: true }),
    ).toBeFocused();
    expect(state.requests).toHaveLength(0);
    await expectNoPageOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`inspection-${width}.png`), fullPage: true });
  });
}

test('inspección distingue buscar de seleccionar y guarda solo con un lugar válido', async ({
  page,
}) => {
  const state = await qualityFixture(page);
  await login(page);
  await page.goto('/calidad/inspecciones/nueva?assetUuid=' + qids.asset);
  const editor = page.locator('tc-quality-inspection-editor');
  const policy = page.getByRole('combobox', { name: 'Política aplicable', exact: true });
  const inspector = page.getByRole('combobox', { name: 'Inspector activo', exact: true });
  const facility = page.getByLabel('Lugar de inspección (instalación) *', { exact: true });
  await inspector.fill('Responsable');
  await page.getByRole('option', { name: 'Responsable documental', exact: true }).click();
  await page.getByLabel('Fecha y hora programada', { exact: true }).fill('2026-10-23T12:00');

  await policy.fill('VISUAL');
  await editor.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(editor.locator('.tc-validation-summary')).toContainText('2 campos');
  await expect(policy).toHaveAttribute('aria-invalid', 'true');
  await expect(
    editor.getByText('Selecciona política aplicable de las opciones disponibles.', { exact: true }),
  ).toBeVisible();
  expect(state.requests).toHaveLength(0);

  await policy.fill('VISUAL');
  await page.getByRole('option', { name: 'VISUAL · A', exact: true }).click();
  await facility.fill('   ');
  await editor.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(editor.locator('.tc-validation-summary')).toContainText('1 campo');
  await expect(page.locator('#quality-inspection-facility-error')).toHaveText(
    'Indica el lugar donde se realizará la inspección.',
  );
  await expect(facility).toBeFocused();
  expect(state.requests).toHaveLength(0);

  await facility.fill('  Taller de pruebas (DEMO)  ');
  await editor.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page).toHaveURL('/calidad/inspecciones/' + qids.inspection);
  expect(state.requests.filter((request) => request.path === '/inspections')).toHaveLength(1);
  expect(state.requests.at(-1)?.body).toMatchObject({
    facility: 'Taller de pruebas (DEMO)',
    policyUuid: qids.policy,
    scheduledAt: expect.stringMatching(/Z$/),
  });
});
