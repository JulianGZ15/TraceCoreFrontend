import { Page, expect } from '@playwright/test';
import fs from 'node:fs/promises';
export async function logisticsLive(page: Page) {
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let password = process.env['TRACECORE_ADMIN_PASSWORD']!;
  let login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  if (login.status() === 401) {
    password = 'IsolatedChanged123!';
    login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  }
  expect(login.ok()).toBe(true);
  const headers = { Authorization: 'Bearer ' + (await login.json()).accessToken };
  const get = async (p: string) => {
    const r = await page.request.get('/api/v1' + p, { headers });
    expect(r.ok(), p + ' ' + (await r.text())).toBe(true);
    return r.json();
  };
  const post = async (p: string, data: unknown) => {
    const r = await page.request.post('/api/v1' + p, { headers, data });
    expect(r.ok(), p + ' ' + (await r.text())).toBe(true);
    return r.json();
  };
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/inicio/);
  const asset = (await get('/inventory/assets?search=REAL-INV-01'))[0];
  const profile = await get('/inventory/assets/' + asset.uuid),
    original = (await get('/equipment/assets/' + asset.uuid)).asset;
  const company = (await get('/company')).uuid;
  const from = profile.assignment.yardUuid;
  const origin = profile.assignment.locationUuid;
  const roots = [] as any[];
  for (let i = 0; i < 3; i++)
    roots.push(
      await post('/equipment/assets', {
        sheetUuid: original.sheetUuid,
        internalCode: 'LOG-LIVE-' + i,
        origin: 'Alta logística aislada',
        registeredAt: null,
        owner: { companyUuid: company, titleReference: 'TITLE-LOG', reason: 'Alta' },
        condition: 'UNKNOWN',
        conditionReason: 'Declarada',
      }),
    );
  const assembly = await post('/equipment/assemblies', {
    parentAssetUuid: roots[0].uuid,
    type: 'PACKAGE',
  });
  await post('/equipment/assemblies/' + assembly.uuid + '/components', {
    assetUuid: roots[1].uuid,
    position: 'VALVE',
    reason: 'Conjunto',
    assemblyVersion: assembly.version,
  });
  const groups = [
    { root: roots[0].uuid, pieces: [roots[0].uuid, roots[1].uuid] },
    { root: roots[2].uuid, pieces: [roots[2].uuid] },
  ];
  for (const g of groups) {
    const opening = await post('/inventory/movements', {
      requestKey: crypto.randomUUID(),
      type: 'INBOUND',
      roots: [{ assetUuid: g.root, destinationLocationUuid: origin }],
      reason: 'Alta física',
      sourceReference: 'LOG-OPEN',
      destinationCustodyMode: 'STORAGE',
    });
    await post('/inventory/movements/' + opening.movement.uuid + '/dispatch', {
      requestKey: crypto.randomUUID(),
      version: opening.movement.version,
    });
  }
  const destination = await post('/yards', {
    code: 'LOG-DEST',
    name: 'Patio entrega logística',
    address: 'Prueba',
    timezone: 'UTC',
  });
  const bay = await post('/inventory/locations', {
    yardUuid: destination.uuid,
    parentUuid: null,
    code: 'LOG-BAY',
    name: 'Bahía recepción',
    type: 'BAY',
    active: true,
    maxPositions: 10,
    maxWeightKg: '999999999999.999999',
    exclusive: false,
  });
  const carrier = await post('/parties', {
    legalName: 'Transportista logística aislado',
    country: 'MX',
    active: true,
  });
  await post('/parties/' + carrier.uuid + '/roles', {
    role: 'CARRIER',
    validFrom: '2000-01-01T00:00:00Z',
    validTo: null,
  });
  const vehicle = await post('/logistics/vehicles', {
    uuid: crypto.randomUUID(),
    carrierUuid: carrier.uuid,
    type: 'TRUCK',
    plate: 'LOG-001',
    jurisdiction: 'MX-NL',
    name: 'Camión real',
    maxWeightKg: '999999999999.999999',
    maxPositions: 10,
    active: true,
    version: null,
  });
  const driver = await post('/logistics/drivers', {
    uuid: crypto.randomUUID(),
    carrierUuid: carrier.uuid,
    name: 'Chofer prueba',
    phone: '+528112345678',
    license: 'LOG-LICENSE',
    licenseType: 'HEAVY',
    jurisdiction: 'MX-NL',
    licenseExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    active: true,
    version: null,
  });
  const moves = [];
  for (const g of groups)
    moves.push(
      await post('/inventory/movements', {
        requestKey: crypto.randomUUID(),
        type: 'TRANSFER',
        roots: [
          {
            assetUuid: g.root,
            destinationLocationUuid: bay.uuid,
            grossWeightKg: '10.123456',
            weightReference: 'Peso por raíz',
          },
        ],
        reason: 'Traslado logístico',
        sourceReference: 'LOG-TRANSFER',
        transitCustodianUuid: carrier.uuid,
        destinationCustodyMode: 'STORAGE',
      }),
    );
  await page.goto('/logistica/manifiestos/nuevo?yardUuid=' + from);
  await page.getByLabel('Tipo', { exact: true }).selectOption('TRANSFER');
  await page.getByLabel('Transportista', { exact: true }).selectOption(carrier.uuid);
  await page.getByLabel('Patio destino (TRANSFER/RETURN)').fill(destination.uuid);
  await page.getByLabel('Motivo del movimiento').fill('Traslado logístico');
  await page.getByLabel('Referencia de origen').fill('LOG-TRANSFER');
  await page.getByLabel('Folio del manifiesto').fill('LOG-MAN-LIVE');
  await page.getByRole('button', { name: 'Paso 2', exact: true }).click();
  for (const move of moves) {
    await page
      .getByRole('combobox', { name: 'Movimiento DRAFT existente', exact: true })
      .selectOption(move.movement.uuid);
    await page.getByRole('button', { name: 'Agregar movimiento seleccionado' }).click();
  }
  await expect(page.getByText('Movimiento:', { exact: false })).toHaveCount(2);
  await page.getByRole('button', { name: 'Paso 4', exact: true }).click();
  await page.getByRole('button', { name: 'Crear manifiesto' }).click();
  await expect(page).toHaveURL(/logistica\/manifiestos\/[a-f0-9-]{36}\/general/);
  const uuid = page.url().split('/').at(-2)!;
  await page.goto('/logistica/manifiestos/' + uuid + '/viaje');
  await page.getByRole('button', { name: 'Planificar viaje' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Vehículo principal', { exact: true }).selectOption(vehicle.uuid);
  await dialog.getByLabel('Chofer', { exact: true }).selectOption(driver.uuid);
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Corregir viaje' }).click();
  dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Llegada prevista (ETA)')
    .fill(new Date(Date.now() + 10800000).toISOString());
  await dialog.getByLabel('Motivo de corrección').fill('Horario confirmado');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect((await get('/logistics/manifests/' + uuid + '/trip/revisions')).length).toBe(1);
  await page.goto('/logistica/manifiestos/' + uuid + '/verificacion');
  await page.getByLabel('Referencia de comprobación').fill('Tally manual completo');
  for (const c of await page.getByRole('checkbox').all()) await c.check();
  await page.getByRole('button', { name: 'Guardar comprobación' }).click();
  await expect(page).toHaveURL(/logistica\/comprobaciones/);
  await page.goto('/logistica/manifiestos/' + uuid + '/despacho');
  await page.getByLabel('Referencia de autorización de salida').fill('Autorización de traslado');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Confirmar salida/ }).click();
  await expect
    .poll(async () => (await get('/logistics/manifests/' + uuid + '/summary')).manifest.state)
    .toBe('IN_TRANSIT');
  await page.goto('/logistica/manifiestos/' + uuid + '/evidencias');
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'logistica-real.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nLogistics proof\n%%EOF'),
    });
  await page.getByRole('button', { name: 'Cargar archivo' }).click();
  await expect(page.getByText('logistica-real.pdf', { exact: true }).first()).toBeVisible();
  const ev = (await get('/logistics/manifests/' + uuid + '/evidence'))[0].record;
  for (let i = 0; i < 2; i++) {
    await page.goto('/logistica/manifiestos/' + uuid + '/recepcion');
    await page.getByRole('button', { name: 'Abrir', exact: true }).first().click();
    await page.getByLabel('Nombre de quien recibe').fill('Receptor autorizado');
    await page.getByLabel('Referencia de entrega').fill('LOG-RECEIPT-' + i);
    await page.getByLabel('Observación de raíces pendientes').fill('Informe de carga pendiente');
    await page
      .getByRole('combobox', { name: 'Evidencia de entrega', exact: true })
      .selectOption(ev.uuid);
    await page
      .getByRole('combobox', { name: 'Ubicación real', exact: true })
      .selectOption(bay.uuid);
    await page.getByLabel('Condición común').selectOption('SERVICEABLE');
    await page.getByLabel('Observación común').fill('Recepción declarada');
    await page.getByRole('button', { name: 'Aplicar explícitamente a estas piezas' }).click();
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Confirmar entrega seleccionada' }).click();
    await expect(page).toHaveURL(/logistica\/entregas/);
    expect((await get('/logistics/manifests/' + uuid + '/summary')).manifest.state).toBe(
      i === 0 ? 'PARTIALLY_DELIVERED' : 'DELIVERED',
    );
  }
  const summary = await get('/logistics/manifests/' + uuid + '/summary');
  expect(summary.trip.state).toBe('COMPLETED');
  expect(summary.deliveredRootCount).toBe(2);
  const manifest = summary.manifest;
  await fs.writeFile(
    process.env['TRACECORE_E2E_LOGISTICS_RECOVERY_FILE']!,
    JSON.stringify({ uuid, key: manifest.requestKey, from, tripUuid: summary.trip.uuid }),
  );
}
