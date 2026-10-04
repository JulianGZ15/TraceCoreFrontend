import { test, expect, Page } from '@playwright/test';
test('isolated PostgreSQL + real backend + Angular: administration and yard scope', async ({
  page,
  browser,
}) => {
  test.skip(
    !process.env['TRACECORE_E2E_ISOLATED'],
    'Run only through tools/test-live-api.ps1 against its disposable database.',
  );
  async function login(target: Page, email: string, password: string) {
    await target.goto('/login');
    await target.getByLabel('Correo electrónico', { exact: true }).fill(email);
    await target.getByLabel('Contraseña', { exact: true }).fill(password);
    await target.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  }
  const adminEmail = process.env['TRACECORE_ADMIN_EMAIL']!,
    adminPassword = process.env['TRACECORE_ADMIN_PASSWORD']!;
  await login(page, adminEmail, adminPassword);
  await expect(page.getByRole('heading', { name: 'Hola, Admin' })).toBeVisible();
  const token = JSON.parse(
    (await page.evaluate(() => sessionStorage.getItem('tracecore.session'))) as string,
  ).token;
  const get = async (path: string) => {
    const response = await page.request.get('/api/v1' + path, {
      headers: { Authorization: 'Bearer ' + token },
    });
    expect(response.ok()).toBe(true);
    return response.json();
  };
  await page.goto('/organizacion/empresa');
  await page.getByLabel('Nombre de la empresa').fill('TraceCore API verificada');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Información actualizada.')).toBeVisible();
  await page.goto('/organizacion/patios');
  await page.getByRole('button', { name: /Nuevo patio/ }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Código').fill('PAT_TEST');
  await dialog.getByLabel('Nombre').fill('Patio de prueba real');
  await dialog.getByLabel('Dirección').fill('Ubicación de prueba');
  await dialog.getByLabel('Zona horaria IANA').fill('America/Mexico_City');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Patio creado.')).toBeVisible();
  const yard = (await get('/yards'))[0];
  await page.goto('/acceso/usuarios');
  await page.getByRole('button', { name: /Nuevo usuario/ }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre completo').fill('Operador Prueba');
  await dialog.getByLabel('Correo electrónico').fill('operator@example.test');
  await dialog.getByLabel('Contraseña inicial').fill('IsolatedOperator123!');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('El usuario fue creado sin roles.', { exact: false })).toBeVisible();
  const operatorContext = await browser.newContext({
    baseURL: process.env['TRACECORE_E2E_FRONT_URL'],
  });
  const operator = await operatorContext.newPage();
  try {
    await login(operator, 'operator@example.test', 'IsolatedOperator123!');
    await expect(operator).toHaveURL(/sin-acceso/);
    await page.goto('/acceso/roles');
    await page.getByRole('button', { name: /Nuevo rol/ }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Código').fill('FRONT_TEST');
    await dialog.getByLabel('Nombre').fill('Operador de prueba');
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText('Rol creado. Agrega sus permisos.')).toBeVisible();
    await page
      .getByRole('row')
      .filter({ hasText: 'FRONT_TEST' })
      .getByRole('button', { name: 'Gestionar permisos' })
      .click();
    await page.getByLabel('Agregar capacidad').selectOption({ label: 'YARD_READ' });
    await page.getByRole('button', { name: 'Agregar permiso' }).click();
    await expect(page.getByText('Permiso agregado.')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar permisos' }).click();
    await page.goto('/acceso/usuarios');
    await page
      .getByRole('row')
      .filter({ hasText: 'operator@example.test' })
      .getByRole('button', { name: 'Asignaciones' })
      .click();
    await page
      .getByLabel('Rol', { exact: true })
      .selectOption({ label: 'Operador de prueba · FRONT_TEST' });
    await page.getByLabel('Alcance', { exact: true }).selectOption('YARD');
    await page.getByLabel('UUID del patio').fill(yard.uuid);
    await page.getByRole('button', { name: 'Asignar rol', exact: true }).click();
    await expect(page.getByText('Rol asignado.')).toBeVisible();
    await operator.goto('/inicio');
    await expect(operator.getByRole('heading', { name: 'Hola, Operador' })).toBeVisible();
    await operator.getByRole('link', { name: /PAT_TEST/ }).click();
    await expect(operator.getByLabel('Nombre', { exact: true })).toHaveValue(
      'Patio de prueba real',
    );
    await expect(operator.getByLabel('Nombre', { exact: true })).toBeDisabled();
    await operator.goto('/acceso/usuarios');
    await expect(operator).toHaveURL(/sin-acceso/);
    await page.getByRole('button', { name: 'Revocar asignación' }).click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByText('Asignación revocada.')).toBeVisible();
    await operator.goto('/inicio');
    await expect(operator).toHaveURL(/sin-acceso/);
    await page.getByRole('button', { name: 'Cerrar asignaciones' }).click();
    await page.goto('/auditoria');
    await expect(page.getByRole('heading', { name: 'Historial de acciones' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver evento' }).first()).toBeVisible();
    await page.goto('/mi-cuenta');
    await page.getByLabel('Contraseña actual').fill(adminPassword);
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('IsolatedChanged123!');
    await page.getByLabel('Confirmar nueva contraseña').fill('IsolatedChanged123!');
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
    await expect(page).toHaveURL(/login/);
    await login(page, adminEmail, 'IsolatedChanged123!');
    await expect(page.getByRole('heading', { name: 'Hola, Admin' })).toBeVisible();
  } finally {
    await operatorContext.close();
  }
});
