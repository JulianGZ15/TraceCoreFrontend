import { Page, expect } from '@playwright/test';
import fs from 'node:fs/promises';
export async function commerceLive(page: Page) {
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let password = process.env['TRACECORE_ADMIN_PASSWORD']!;
  let login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  if (login.status() === 401) {
    password = 'IsolatedChanged123!';
    login = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  }
  expect(login.ok()).toBe(true);
  const headers = { Authorization: 'Bearer ' + (await login.json()).accessToken };
  const get = async (path: string) => {
    const r = await page.request.get('/api/v1' + path, { headers });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  };
  const post = async (path: string, data: unknown) => {
    const r = await page.request.post('/api/v1' + path, { headers, data });
    expect(r.ok(), path + ' ' + (await r.text())).toBe(true);
    return r.json();
  };
  const uuid = () => crypto.randomUUID();
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/inicio/);
  const asset = (await get('/quality/assets?search=REAL-INV-01'))[0];
  const profile = await get('/inventory/assets/' + asset.uuid);
  const yard = asset.yardUuid,
    location = profile.assignment.locationUuid;
  const party = await post('/parties', {
    legalName: 'Cliente comercio real',
    tradeName: null,
    country: 'MX',
    active: true,
  });
  await post('/parties/' + party.uuid + '/roles', {
    role: 'CUSTOMER',
    validFrom: '2000-01-01T00:00:00Z',
    validTo: null,
  });
  await post('/parties/' + party.uuid + '/operation-authorizations', {
    operation: 'OR',
    validFrom: '2000-01-01T00:00:00Z',
    validTo: null,
  });
  const site = await post('/inventory/sites', {
    parentUuid: null,
    code: 'COMMERCE_SITE',
    name: 'Sitio cliente comercial',
    type: 'OTHER',
    operatorUuid: party.uuid,
    address: 'Dirección prueba',
    latitude: null,
    longitude: null,
    active: true,
  });
  if (!(await get('/finance/currencies')).some((x: any) => x.code === 'MXN'))
    await post('/finance/currencies', {
      uuid: uuid(),
      code: 'MXN',
      name: 'Peso mexicano',
      fractionDigits: 2,
    });
  const account = await post('/finance/credit-accounts', {
    uuid: uuid(),
    partyUuid: party.uuid,
    currency: 'MXN',
    creditLimit: '100000.00',
    validFrom: '2000-01-01T00:00:00Z',
    validTo: null,
  });
  await post('/finance/credit-accounts/' + account.uuid + '/activate', {
    version: account.version,
  });
  const from = new Date(Date.now() - 60000).toISOString(),
    to = new Date(Date.now() + 3600000).toISOString();
  const payload = {
    uuid: uuid(),
    type: 'OR',
    series: 'TEST',
    folio: 'OR-LIVE',
    partyUuid: party.uuid,
    yardUuid: yard,
    currency: 'MXN',
    orderedAt: new Date().toISOString(),
    avlScope: 'GENERAL',
    termsUuid: null,
    termsReference: 'Contrato real aislado',
    purchase: null,
    sale: null,
    rental: {
      frameworkUuid: null,
      distributorUuid: null,
      endCustomerUuid: party.uuid,
      payerUuid: party.uuid,
      siteUuid: site.uuid,
      plannedFrom: from,
      plannedTo: to,
      timezone: 'America/Mexico_City',
      responsibilities: 'Custodia del cliente',
    },
  };
  const order = await post('/commercial/orders', payload);
  const line = await post('/commercial/orders/' + order.uuid + '/lines', {
    orderVersion: order.version,
    line: {
      uuid: uuid(),
      lineNumber: 1,
      kind: 'EQUIPMENT',
      modelUuid: asset.modelUuid,
      concept: 'Equipo de renta real',
      quantity: '1',
      unit: 'PIECE',
      unitPrice: '10.1234',
      discountFraction: '0',
      taxFraction: '0',
    },
  });
  let summary = await get('/commercial/orders/' + order.uuid + '/summary');
  const rental = summary.rental;
  for (const mode of ['ACTIVE', 'STANDBY'])
    await post('/commercial/rentals/' + rental.uuid + '/rates', {
      uuid: uuid(),
      lineUuid: line.uuid,
      mode,
      amount: mode === 'ACTIVE' ? '12.3456' : '2.0000',
      timeUnit: 'HOUR',
      rounding: 'PROPORTIONAL',
      minimumUnits: '0',
      from,
      to,
      reference: 'Tarifa revisada',
    });
  await page.goto('/comercial/ordenes/' + order.uuid + '/credito');
  await page.getByLabel('Compromiso aprobado exacto').fill('1000.17');
  await page.getByLabel('Motivo', { exact: true }).fill('Estimación revisada');
  await page.getByRole('button', { name: 'Aprobar compromiso de crédito' }).click();
  await expect
    .poll(
      async () =>
        (await get('/finance/orders/' + order.uuid + '/credit-context')).commitment
          ?.approvedAmountExact,
    )
    .toBe('1000.17');
  await page.goto('/comercial/ordenes/' + order.uuid + '/partidas');
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await page.getByRole('button', { name: 'Editar borrador' }).click();
  let d = page.getByRole('dialog');
  await d.getByLabel('Concepto', { exact: true }).fill('Equipo de renta corregido');
  await d.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(d).toHaveCount(0);
  expect((await get('/commercial/lines/' + line.uuid)).unitPriceExact).toBe('10.1234');
  await page.goto('/comercial/ordenes/' + order.uuid + '/general');
  await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
  d = page.getByRole('dialog');
  await d.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(d).toHaveCount(0);
  expect((await get('/commercial/orders/' + order.uuid + '/summary')).order.state).toBe('APPROVED');
  const evidence = (await get('/quality/evidence?limit=100')).find(
    (x: any) => x.fileName === 'Calidad-real.pdf',
  );
  await post('/quality/releases', {
    assetUuid: asset.uuid,
    scope: 'BOTH',
    validTo: to,
    evidenceUuid: evidence.uuid,
  });
  const allocations = await post('/commercial/allocations', {
    requestKey: uuid(),
    lineUuid: line.uuid,
    rootAssetUuid: asset.uuid,
    from: new Date(Date.now() + 1000).toISOString(),
    to,
    expiresAt: new Date(Date.now() + 120000).toISOString(),
    ownerAuthorizationReference: 'Autorización del propietario de prueba',
  });
  const root = allocations.find((x: any) => x.assetUuid === x.rootAssetUuid);
  let movement = await post('/inventory/movements', {
    requestKey: uuid(),
    type: 'OUTBOUND',
    roots: [
      {
        assetUuid: asset.uuid,
        destinationSiteUuid: site.uuid,
        reservationUuid: root.reservationUuid,
      },
    ],
    reason: 'Entrega renta',
    sourceReference: 'COMMERCE-LIVE-DELIVERY',
    destinationCustodianUuid: party.uuid,
    destinationCustodyMode: 'RENTAL',
    ownerAuthorizationReference: 'Autorización del propietario de prueba',
  });
  await expect.poll(() => Date.now() >= Date.parse(root.plannedFrom)).toBe(true);
  movement = await post('/inventory/movements/' + movement.movement.uuid + '/dispatch', {
    requestKey: uuid(),
    authorizationReference: 'Orden comercial aprobada',
    version: movement.movement.version,
  });
  movement = await post('/inventory/movements/' + movement.movement.uuid + '/receive', {
    requestKey: uuid(),
    destinations: [],
    conditions: [],
    version: movement.movement.version,
  });
  await page.goto('/comercial/ordenes/' + order.uuid + '/asignaciones');
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar entrega recibida' }).click();
  d = page.getByRole('dialog');
  await d.getByLabel('OUTBOUND completado', { exact: true }).selectOption(movement.movement.uuid);
  await d.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(d).toHaveCount(0);
  const assignments = await get('/commercial/rentals/' + rental.uuid + '/assignments');
  const assignment = assignments.find((x: any) => x.assetUuid === x.rootAssetUuid);
  const end = new Date().toISOString();
  await page.goto('/comercial/asignaciones/' + assignment.uuid + '/corte');
  await page.getByLabel('Fin con offset').fill(end);
  await page.getByRole('button', { name: 'Previsualizar en servidor' }).click();
  await expect(page.getByRole('button', { name: 'Confirmar corte definitivo' })).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Confirmar corte definitivo' }).click();
  await expect(page).toHaveURL(/comercial\/cortes\/[a-f0-9-]{36}$/);
  const billing = await get('/commercial/billings/' + page.url().split('/').at(-1));
  expect(typeof billing.amountExact).toBe('string');
  const download = page.waitForEvent('download');
  await page.goto('/comercial/ordenes/' + order.uuid + '/evidencias');
  await page.getByLabel('Cargar evidencia').setInputFiles({
    name: 'Contrato-comercial.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nCommercial isolated\n%%EOF'),
  });
  await expect(page.getByText('Contrato-comercial.pdf')).toBeVisible();
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('Contrato-comercial.pdf');
  let returned = await post('/inventory/movements', {
    requestKey: uuid(),
    type: 'RETURN',
    roots: [{ assetUuid: asset.uuid, destinationLocationUuid: location }],
    reason: 'Retorno del grupo completo',
    sourceReference: 'COMMERCE-LIVE-RETURN',
    destinationCustodyMode: 'STORAGE',
  });
  returned = await post('/inventory/movements/' + returned.movement.uuid + '/dispatch', {
    requestKey: uuid(),
    version: returned.movement.version,
  });
  returned = await post('/inventory/movements/' + returned.movement.uuid + '/receive', {
    requestKey: uuid(),
    destinations: [],
    conditions: [],
    version: returned.movement.version,
  });
  await page.goto('/comercial/recepciones/nueva?yardUuid=' + yard);
  await page.getByLabel('Folio de recepción', { exact: true }).fill('RETURN-RECEIPT-LIVE');
  await page.getByLabel('Origen', { exact: true }).selectOption(party.uuid);
  await page
    .getByLabel('Movimiento completado', { exact: true })
    .selectOption(returned.movement.uuid);
  await page.getByLabel('Referencia administrativa', { exact: true }).fill('Retorno recibido');
  await page.getByRole('button', { name: 'Consultar snapshot del movimiento' }).click();
  await page.getByRole('checkbox').check();
  await page
    .getByLabel('Observación de pieza', { exact: true })
    .fill('Grupo recibido e identificado; condición declarada conservada.');
  await page.getByRole('button', { name: 'Registrar recepción administrativa' }).click();
  await expect(page).toHaveURL(/comercial\/recepciones\/[a-f0-9-]{36}$/);
  const receiptUuid = page.url().split('/').at(-1)!;
  await page.goto('/comercial/rentas/' + rental.uuid + '/devoluciones/nueva');
  await page.getByLabel('Folio de devolución', { exact: true }).fill('RETURN-LIVE');
  await page
    .getByLabel('Recepción administrativa del cliente final', { exact: true })
    .selectOption(receiptUuid);
  await page
    .getByLabel('Asignación raíz del contrato', { exact: true })
    .selectOption(assignment.uuid);
  await page.getByLabel('Referencia', { exact: true }).fill('Devolución documentada');
  await page.getByRole('button', { name: 'Revisar grupo completo' }).click();
  await expect(page.getByLabel('Observaciones de cargos pendientes')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar devolución administrativa' }).click();
  await expect(page).toHaveURL(/comercial\/devoluciones\/[a-f0-9-]{36}$/);
  expect((await get('/commercial/assignments/' + assignment.uuid)).state).toBe('RETURNED');
  const current = await get('/commercial/orders/' + order.uuid + '/summary');
  if (process.env['TRACECORE_E2E_COMMERCE_RECOVERY_FILE'])
    await fs.writeFile(
      process.env['TRACECORE_E2E_COMMERCE_RECOVERY_FILE']!,
      JSON.stringify({
        payload,
        orderUuid: order.uuid,
        lineUuid: line.uuid,
        concept: 'Equipo de renta corregido',
        version: current.order.version,
        billingKey: billing.requestKey,
        billingUuid: billing.uuid,
      }),
    );
}
