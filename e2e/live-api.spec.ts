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
  await expect(
    page.getByRole('heading', { name: 'Cerrar condición comercial', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Fin exclusivo')).toHaveClass(/ng-pristine/);
  await page.getByLabel('Fin exclusivo').fill('2030-01-01T00:00');
  await expect(page.getByLabel('Fin exclusivo')).toHaveClass(/ng-dirty/);
  await expect(page.getByLabel('Fin exclusivo')).toHaveValue('2030-01-01T00:00');
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
  await expect(page.getByRole('dialog').getByLabel('Alcance AVL')).toHaveClass(/ng-pristine/);
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
  await expect(page.getByLabel('Ubicación', { exact: true })).toHaveClass(/ng-pristine/);
  await page.getByLabel('Ubicación', { exact: true }).selectOption('REGION');
  await expect(page.getByLabel('Ubicación', { exact: true })).toHaveValue('REGION');
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

test('stage three and four real API: exact catalog, inbound, custody, reservations, reconciliation and count', async ({
  page,
  browser,
}) => {
  test.skip(!process.env['TRACECORE_E2E_ISOLATED'], 'Requires the isolated PostgreSQL runner.');
  test.setTimeout(150000);
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let password = process.env['TRACECORE_ADMIN_PASSWORD']!;
  let login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  if (login.status() === 401) {
    password = 'IsolatedChanged123!';
    login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  }
  expect(login.ok()).toBe(true);
  const headers = { Authorization: 'Bearer ' + (await login.json()).accessToken };
  async function get(path: string) {
    const r = await page.request.get('/api/v1' + path, { headers });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  }
  async function post(path: string, data: unknown) {
    const r = await page.request.post('/api/v1' + path, { headers, data });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  }
  const company = (await get('/auth/context')).company;
  const oem = await post('/parties', {
    legalName: 'Fabricante prueba inventario',
    tradeName: null,
    country: 'MX',
    active: true,
  });
  await post('/parties/' + oem.uuid + '/roles', { role: 'OEM', validFrom: null, validTo: null });
  const category = await post('/equipment/categories', {
    code: 'INV_GENERAL',
    name: 'Equipo general prueba',
    technicalKind: 'GENERAL',
    parentUuid: null,
    active: true,
  });
  const model = await post('/equipment/models', {
    categoryUuid: category.uuid,
    manufacturerUuid: oem.uuid,
    code: 'INV_MODEL',
    description: 'Modelo prueba',
    active: true,
  });
  let sheet = await post('/equipment/models/' + model.uuid + '/sheets', {
    revision: 'A',
    validFrom: '2020-01-01T00:00:00Z',
    validTo: null,
    specs: { weight: { value: '10.123456', unit: 'KG' } },
    documentReference: 'Ficha manual',
  });
  sheet = await post('/equipment/sheets/' + sheet.uuid + '/approval', { version: sheet.version });
  const asset = await post('/equipment/assets', {
    sheetUuid: sheet.uuid,
    internalCode: 'REAL-INV-01',
    serialNumber: null,
    origin: 'Compra de prueba',
    registeredAt: null,
    referenceValue: '999999999999999.9999',
    currency: 'MXN',
    valuationReference: 'VAL-01',
    owner: {
      companyUuid: company.uuid,
      partyUuid: null,
      titleReference: 'TITLE-01',
      reason: 'Alta inicial',
    },
    condition: 'UNKNOWN',
    conditionReason: 'Condición inicial declarada',
  });
  expect(asset.referenceValueExact).toBe('999999999999999.9999');
  const yard = await post('/yards', {
    code: 'INV_REAL',
    name: 'Patio operativo prueba',
    address: 'Dirección prueba',
    timezone: 'America/Mexico_City',
  });
  const location = await post('/inventory/locations', {
    yardUuid: yard.uuid,
    parentUuid: null,
    code: 'BAY_REAL',
    name: 'Bahía operación real',
    type: 'BAY',
    active: true,
    maxPositions: 10,
    maxWeightKg: '999999999999.999999',
    exclusive: false,
  });
  expect(location.maxWeightKgExact).toBe('999999999999.999999');
  const prepared = await post('/inventory/movements', {
    requestKey: crypto.randomUUID(),
    type: 'INBOUND',
    roots: [
      {
        assetUuid: asset.uuid,
        destinationLocationUuid: location.uuid,
        destinationSiteUuid: null,
        grossWeightKg: null,
        weightReference: null,
        reservationUuid: null,
      },
    ],
    reason: 'Ingreso real documentado',
    sourceReference: 'IN-REAL',
    destinationCustodyMode: 'STORAGE',
  });
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/inicio/);
  await page.goto('/equipos/' + asset.uuid + '/general');
  await expect(page.getByRole('heading', { name: 'REAL-INV-01' })).toBeVisible();
  await page.goto('/inventario/movimientos/' + prepared.movement.uuid);
  await page.getByRole('button', { name: 'Confirmar salida', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Salida confirmada.', { exact: true })).toBeVisible();
  expect((await get('/inventory/movements/' + prepared.movement.uuid)).movement.state).toBe(
    'COMPLETED',
  );
  const overview = await get('/inventory/locations/overview?yardUuid=' + yard.uuid);
  expect(overview.items[0].occupancy.knownWeightKgExact).toBe('10.123456');
  await page.goto('/inventario/equipos/' + asset.uuid + '/custodia');
  await page.getByRole('button', { name: 'Transferir custodia del conjunto' }).click();
  await page.getByRole('dialog').getByLabel('Acuerdo', { exact: true }).fill('CUSTODY-REAL');
  await page
    .getByRole('dialog')
    .getByLabel('Motivo', { exact: true })
    .fill('Actualización del acuerdo');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await get('/inventory/assets/' + asset.uuid)).asset.referenceValueExact).toBe(
    '999999999999999.9999',
  );
  const now = Date.now(),
    start = new Date(now + 3600000).toISOString(),
    end = new Date(now + 7200000).toISOString();
  const group = await post('/inventory/reservations', {
    requestKey: crypto.randomUUID(),
    rootAssetUuid: asset.uuid,
    beneficiaryUuid: null,
    validFrom: start,
    validTo: end,
    expiresAt: new Date(now + 1800000).toISOString(),
    requestReference: 'RES-REAL',
  });
  await page.goto('/inventario/reservas/' + group[0].uuid);
  await page.getByRole('button', { name: 'Confirmar grupo', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Confirmado', exact: true })).toBeVisible();
  await page.getByLabel('Motivo de cancelación').fill('Fin de prueba');
  await page.getByRole('button', { name: 'Cancelar grupo', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cancelado', exact: true })).toBeVisible();
  const proposal = await post('/inventory/proposals', {
    movement: {
      requestKey: crypto.randomUUID(),
      type: 'TRANSFER',
      roots: [{ assetUuid: asset.uuid, destinationLocationUuid: location.uuid }],
      reason: 'Verificación manual',
      sourceReference: 'PROP-REAL',
      destinationCustodyMode: 'STORAGE',
    },
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    observations: [{ assetUuid: asset.uuid, identifier: null }],
  });
  await page.goto('/inventario/propuestas/' + proposal.proposal.uuid);
  await page.getByLabel('Motivo obligatorio').fill('Coincidencia revisada');
  await page.getByRole('button', { name: 'Registrar decisión' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Ver movimiento resultante' })).toBeVisible();
  await page.goto('/inventario/conteos?yardUuid=' + yard.uuid);
  await page.getByRole('button', { name: 'Abrir conteo manual', exact: true }).click();
  await page.getByLabel('Referencia de apertura').fill('COUNT-REAL');
  await page.getByRole('button', { name: 'Abrir conteo', exact: true }).click();
  await expect(page).toHaveURL(/inventario\/conteos\/[a-f0-9-]+$/);
  const countUuid = page.url().split('/').at(-1)!;
  await page.getByRole('button', { name: /REAL-INV-01/ }).click();
  await page.getByRole('button', { name: /BAY_REAL/ }).click();
  await page.getByLabel('Referencia de observación').fill('Planilla manual real');
  await page.getByRole('button', { name: 'Registrar observación', exact: true }).click();
  await expect(page.getByText('Observación registrada.', { exact: true })).toBeVisible();
  expect((await get('/inventory/counts/' + countUuid + '/items'))[0].difference).toBe('MATCHED');
  await page.getByLabel('Motivo de cierre o cancelación').fill('Conteo conciliado');
  await page
    .getByRole('button', { name: 'Cerrar (todas las diferencias resueltas)', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Manual · Cerrado · Apertura', { exact: false })).toBeVisible();
  expect((await get('/inventory/counts/' + countUuid)).state).toBe('CLOSED');
  await page.goto('/inventario/ubicaciones/' + location.uuid);
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Nombre', { exact: true })
    .fill('Bahía real actualizada');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await get('/inventory/locations/' + location.uuid)).maxWeightKgExact).toBe(
    '999999999999.999999',
  );
  await page.goto('/inventario/sitios');
  await page.getByRole('button', { name: 'Nuevo sitio', exact: true }).click();
  const siteDialog = page.getByRole('dialog');
  await siteDialog.getByLabel('Código', { exact: true }).fill('SITE_REAL');
  await siteDialog.getByLabel('Nombre', { exact: true }).fill('Sitio externo real');
  await siteDialog.getByLabel('Dirección', { exact: true }).fill('Dirección externa manual');
  await siteDialog.getByLabel('Latitud (opcional)', { exact: true }).fill('25.123456');
  await siteDialog.getByLabel('Longitud (opcional)', { exact: true }).fill('-100.123456');
  await siteDialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(siteDialog).toHaveCount(0);
  const realSite = (await get('/inventory/sites')).find(
    (s: { code: string }) => s.code === 'SITE_REAL',
  );
  expect((await get('/inventory/sites/' + realSite.uuid)).longitudeExact).toBe('-100.123456');
  const permissions = await get('/permissions?limit=100');
  const role = await post('/roles', { code: 'INV_ONLY_READ', name: 'Lectura operativa aislada' });
  await post('/roles/' + role.uuid + '/permissions', {
    permissionUuid: permissions.find((p: { code: string }) => p.code === 'INVENTORY_READ').uuid,
  });
  const operator = await post('/users', {
    name: 'Operador Inventario',
    email: 'inventory@example.test',
    password: 'InventoryOnly123!',
  });
  await post('/users/' + operator.uuid + '/assignments', {
    roleUuid: role.uuid,
    scopeType: 'YARD',
    companyUuid: company.uuid,
    yardUuid: yard.uuid,
    validFrom: null,
    validTo: null,
  });
  const context = await browser.newContext({ baseURL: process.env['TRACECORE_E2E_FRONT_URL'] });
  try {
    const other = await context.newPage();
    await other.goto('/login');
    await other.getByLabel('Correo electrónico', { exact: true }).fill(operator.email);
    await other.getByLabel('Contraseña', { exact: true }).fill('InventoryOnly123!');
    await other.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(other).toHaveURL(/inicio/);
    await other.goto('/inventario/patios');
    await expect(other.getByText('Bahía real actualizada', { exact: false })).toBeVisible();
    await other.goto('/inventario/equipos/' + asset.uuid + '/actual');
    await expect(other.getByRole('heading', { name: 'REAL-INV-01' })).toBeVisible();
    await expect(other.getByRole('link', { name: 'Expediente técnico', exact: true })).toHaveCount(
      0,
    );
    await other.goto('/catalogo/categorias');
    await expect(other).toHaveURL(/sin-acceso/);
  } finally {
    await context.close();
  }
  const destinationYard = await post('/yards', {
    code: 'INV_DEST',
    name: 'Patio recepción',
    address: 'Destino prueba',
    timezone: 'America/Mexico_City',
  });
  const destination = await post('/inventory/locations', {
    yardUuid: destinationYard.uuid,
    parentUuid: null,
    code: 'DEST_REAL',
    name: 'Destino recepción',
    type: 'BAY',
    active: true,
    maxPositions: 5,
    maxWeightKg: null,
    exclusive: false,
  });
  const transfer = await post('/inventory/movements', {
    requestKey: crypto.randomUUID(),
    type: 'TRANSFER',
    roots: [{ assetUuid: asset.uuid, destinationLocationUuid: destination.uuid }],
    reason: 'Traslado entre patios',
    sourceReference: 'TRANSFER-REAL',
    destinationCustodyMode: 'STORAGE',
  });
  await page.goto('/inventario/movimientos/' + transfer.movement.uuid);
  await page.getByRole('button', { name: 'Confirmar salida', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Salida confirmada.', { exact: true })).toBeVisible();
  expect((await get('/inventory/movements/' + transfer.movement.uuid)).movement.state).toBe(
    'IN_TRANSIT',
  );
  await page.goto('/inventario/movimientos/' + transfer.movement.uuid + '/recepcion');
  await page.getByLabel('Condición', { exact: true }).selectOption('DAMAGED');
  await page.getByLabel('Motivo', { exact: true }).fill('Daño declarado al recibir');
  await page.getByRole('button', { name: 'Confirmar recepción completa' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page).toHaveURL('/inventario/movimientos/' + transfer.movement.uuid);
  expect((await get('/inventory/assets/' + asset.uuid)).assignment.locationUuid).toBe(
    destination.uuid,
  );
  expect((await get('/equipment/assets/' + asset.uuid)).condition.condition).toBe('DAMAGED');
});

import { qualityLive } from './quality-live';
test('stage five real API: evidence, corrected MTR, inspections, maintenance and releases', async ({
  page,
}) => {
  test.skip(!process.env['TRACECORE_E2E_ISOLATED'], 'Requires disposable PostgreSQL.');
  test.setTimeout(240000);
  await qualityLive(page);
});

import { commerceLive } from './commerce-live';
test('stage seven real API: rental, credit, revised draft, physical delivery, cut and evidence', async ({
  page,
}) => {
  test.skip(!process.env['TRACECORE_E2E_ISOLATED'], 'Requires disposable PostgreSQL.');
  test.setTimeout(180000);
  await commerceLive(page);
});

import { logisticsLive } from './logistics-live';
test('stage eight real API: grouped manifest, trip correction, dispatch and partial whole-root deliveries', async ({
  page,
}) => {
  test.skip(!process.env['TRACECORE_E2E_ISOLATED'], 'Disposable database only');
  test.setTimeout(180000);
  await logisticsLive(page);
});

import { financeLive } from './finance-live';
test('stage nine real API: charges, invoice preview, payments, applications, notes, reversals, credit and evidence',async({page})=>{test.skip(!process.env['TRACECORE_E2E_ISOLATED'],'Disposable database only');test.setTimeout(180000);await financeLive(page);});
