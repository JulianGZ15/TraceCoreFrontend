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

test('stage two real API: dossiers, evidence, exact credit, AVL eligibility and quotas', async ({
  page,
  browser,
}) => {
  test.skip(
    !process.env['TRACECORE_E2E_ISOLATED'],
    'Requires disposable PostgreSQL/evidence storage.',
  );
  test.setTimeout(150000);
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let password = process.env['TRACECORE_ADMIN_PASSWORD']!;
  let login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  if (login.status() === 401) {
    password = 'IsolatedChanged123!';
    login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  }
  expect(login.ok()).toBe(true);
  const auth = (await login.json()).accessToken,
    headers = { Authorization: 'Bearer ' + auth };
  async function get(path: string) {
    const result = await page.request.get('/api/v1' + path, { headers });
    expect(result.ok(), await result.text()).toBe(true);
    return result.json();
  }
  async function post(path: string, data: unknown) {
    const result = await page.request.post('/api/v1' + path, { headers, data });
    expect(result.ok(), await result.text()).toBe(true);
    return result.json();
  }
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('link', { name: 'Terceros y AVL', exact: true }).click();
  await page.getByRole('button', { name: '+ Nuevo tercero' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Razón social').fill('Tercero prueba API real');
  await dialog.getByLabel('Nombre comercial').fill('Expediente integral');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page).toHaveURL(/terceros\/.*\/general/);
  const uuid = page.url().split('/').at(-2)!,
    base = '/parties/' + uuid;
  async function section(name: string, heading: string) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await section('Roles', 'Roles del tercero');
  for (const role of ['CUSTOMER', 'SUPPLIER', 'DISTRIBUTOR']) {
    await page.getByRole('button', { name: '+ Asignar rol' }).click();
    await page.getByLabel('Rol', { exact: true }).selectOption(role);
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  expect((await get(base + '/roles')).length).toBe(3);
  await section('Contactos', 'Contactos');
  for (const name of ['Contacto A', 'Contacto B']) {
    await page.getByRole('button', { name: '+ Nuevo registro' }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nombre completo').fill(name);
    await dialog
      .getByLabel('Correo electrónico')
      .fill(name === 'Contacto A' ? 'a@example.test' : 'b@example.test');
    await dialog.getByLabel('Contacto principal').check();
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  const contacts = await get(base + '/contacts');
  expect(contacts.filter((r: { primary: boolean }) => r.primary)).toHaveLength(1);
  expect(contacts.find((r: { name: string }) => r.name === 'Contacto B').primary).toBe(true);
  await section('Domicilios', 'Domicilios');
  await page.getByRole('button', { name: '+ Nuevo registro' }).click();
  await page.getByLabel('Tipo', { exact: false }).selectOption('FISCAL');
  await page.getByLabel('Dirección', { exact: false }).fill('Av. Prueba 123');
  await page.getByLabel('Localidad').fill('Monterrey');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('cell').filter({ hasText: 'Av. Prueba 123' })).toBeVisible();
  await section('Evidencias', 'Evidencias');
  const pdf = Buffer.from('%PDF-1.7\nEvidence for isolated browser test\n%%EOF');
  await page
    .getByLabel('Archivo PDF')
    .setInputFiles({ name: 'prueba-real.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.getByRole('button', { name: 'Cargar archivo' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'prueba-real.pdf' })).toBeVisible();
  const evidence = (await get(base + '/evidence'))[0];
  expect(evidence.sha256).toMatch(/^[a-f0-9]{64}$/);
  const content = await page.request.get(
    '/api/v1' + base + '/evidence/' + evidence.uuid + '/content',
    { headers },
  );
  expect(await content.body()).toEqual(pdf);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar evidencia' }).click();
  expect((await download).suggestedFilename()).toBe('prueba-real.pdf');
  await section('Identificaciones fiscales', 'Identificaciones fiscales');
  await page.getByRole('button', { name: '+ Nuevo registro' }).click();
  await page.getByLabel('Tipo de identificación').fill('RFC');
  await page.getByLabel('Número fiscal').fill('test-123.456');
  await page.getByLabel('Archivo de evidencia').selectOption(evidence.uuid);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('button', { name: 'Verificado', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('TEST123456', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Editar identificación', exact: true }),
  ).toHaveCount(0);
  expect((await get(base + '/tax-identities'))[0].verification).toBe('VERIFIED');
  await section('Certificaciones', 'Certificaciones');
  await page.getByRole('button', { name: '+ Nuevo registro' }).click();
  await page.getByLabel('Norma').fill('API 6A');
  await page.getByLabel('Número / licencia').fill('CERT_TEST');
  await page.getByLabel('Emisor').fill('Emisor prueba');
  await page.getByLabel('Fecha de emisión').fill('2020-01-01');
  await page.getByLabel('Fecha de vencimiento').fill('2030-12-31');
  await page.getByLabel('Archivo de evidencia').selectOption(evidence.uuid);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('button', { name: 'Verificado', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Editar certificación', exact: true })).toHaveCount(
    0,
  );
  expect((await get(base + '/certifications'))[0].verification).toBe('VERIFIED');
  await section('Condiciones', 'Condiciones comerciales');
  await page.getByRole('button', { name: '+ Nuevo registro' }).click();
  await page.getByLabel('Divisa ISO').fill('USD');
  await page.getByLabel('Código de método de pago').fill('WIRE');
  await page.getByLabel('Código de condición de pago').fill('NET_30');
  await page.getByLabel('Límite de crédito').fill('999999999999999.9999');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(
    page.getByRole('cell').filter({ hasText: '999,999,999,999,999.9999 USD' }),
  ).toBeVisible();
  let terms = (await get(base + '/commercial-terms'))[0];
  expect(terms.creditLimitExact).toBe('999999999999999.9999');
  await page.getByRole('button', { name: 'Cerrar vigencia' }).click();
  await page.getByLabel('Fin exclusivo').fill('2030-01-01T00:00');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  terms = (await get(base + '/commercial-terms'))[0];
  expect(terms.creditLimitExact).toBe('999999999999999.9999');
  expect(terms.validTo).toBe('2030-01-01T00:00:00Z');
  await section('Autorizaciones', 'Autorizaciones y elegibilidad');
  for (const operation of ['OC', 'OV', 'OR']) {
    await page.getByRole('button', { name: '+ Nuevo registro' }).click();
    await page.getByRole('dialog').getByLabel('Operación', { exact: true }).selectOption(operation);
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.getByLabel('Alcance AVL exacto').fill('API_6A');
  await page.getByRole('button', { name: 'Consultar elegibilidad' }).click();
  await expect(page.getByText('No elegible', { exact: false })).toBeVisible();
  await section('AVL', 'Evaluaciones AVL');
  await page.getByRole('button', { name: '+ Nueva evaluación' }).click();
  await page.getByLabel('Alcance AVL').fill('API_6A');
  await page.getByLabel('Score').fill('99.50');
  await page.getByLabel('Clasificación declarada').fill('TIER_1');
  await page.getByLabel('Dictamen').selectOption('APPROVED');
  await page.getByLabel('Hallazgos').fill('Evaluación manual API real');
  await page.getByLabel('Próxima revisión').fill('2030-01-01T00:00');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Aprobado', { exact: true })).toBeVisible();
  await section('Autorizaciones', 'Autorizaciones y elegibilidad');
  await page.getByLabel('Alcance AVL exacto').fill('API_6A');
  await page.getByRole('button', { name: 'Consultar elegibilidad' }).click();
  await expect(page.getByText('Elegible actualmente', { exact: false })).toBeVisible();
  const eligibility = await get(base + '/eligibility?operation=OC&avlScope=API_OTHER');
  expect(eligibility.allowed).toBe(false);
  await section('Cuotas', 'Cuotas de distribución');
  await page.getByRole('button', { name: '+ Nuevo registro' }).click();
  await page.getByLabel('Ubicación', { exact: true }).selectOption('REGION');
  await page.getByLabel('Código de región').fill('NORTH');
  await page.getByLabel('Alcance contractual').fill('TUBULAR_API5CT');
  await page.getByLabel('Cantidad').fill('10');
  await page.getByLabel('Inicio', { exact: true }).fill('2030-01-01T00:00');
  await page.getByLabel('Fin exclusivo').fill('2030-02-01T00:00');
  await page.getByLabel('Condiciones', { exact: false }).fill('Compromiso de prueba real');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('NORTH', { exact: true })).toBeVisible();
  expect((await get(base + '/distribution-quotas'))[0].quantity).toBe(10);
  await page.getByRole('button', { name: 'Revocar cuota' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Revocar cuota', exact: true })).toHaveCount(0);
  expect((await get(base + '/distribution-quotas'))[0].revokedAt).not.toBeNull();
  // An approver can discover active quota yards without gaining YARD_READ/YARD_MANAGE.
  const permissions = await get('/permissions?limit=100'),
    company = (await get('/auth/context')).company;
  const role = await post('/roles', {
    code: 'PARTY_APPROVER_TEST',
    name: 'Aprobador terceros prueba',
  });
  for (const code of ['PARTY_READ', 'PARTY_APPROVE'])
    await post('/roles/' + role.uuid + '/permissions', {
      permissionUuid: permissions.find((p: { code: string }) => p.code === code).uuid,
    });
  const approver = await post('/users', {
    name: 'Aprobador Prueba',
    email: 'approver@example.test',
    password: 'IsolatedApprover123!',
  });
  await post('/users/' + approver.uuid + '/assignments', {
    roleUuid: role.uuid,
    scopeType: 'COMPANY',
    companyUuid: company.uuid,
    yardUuid: null,
    validFrom: null,
    validTo: null,
  });
  const otherContext = await browser.newContext({
    baseURL: process.env['TRACECORE_E2E_FRONT_URL'],
  });
  try {
    const other = await otherContext.newPage();
    await other.goto('/login');
    await other.getByLabel('Correo electrónico', { exact: true }).fill(approver.email);
    await other.getByLabel('Contraseña', { exact: true }).fill('IsolatedApprover123!');
    await other.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(other).toHaveURL(/\/inicio$/);
    await other.goto('/terceros/' + uuid + '/cuotas');
    await other.getByRole('button', { name: '+ Nuevo registro' }).click();
    await expect(other.getByLabel('Patio activo')).toContainText('Patio de prueba real');
    await expect(other.getByRole('link', { name: 'Patios', exact: true })).toHaveCount(0);
  } finally {
    await otherContext.close();
  }
});
