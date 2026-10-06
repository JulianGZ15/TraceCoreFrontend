import { Page, expect } from '@playwright/test';
import fs from 'node:fs/promises';
export async function financeLive(page: Page) {
  const email = process.env['TRACECORE_ADMIN_EMAIL']!;
  let password = process.env['TRACECORE_ADMIN_PASSWORD']!;
  let auth = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  if (auth.status() === 401) {
    password = 'IsolatedChanged123!';
    auth = await page.request.post('/api/v1/auth/login', { data: { email, password } });
  }
  expect(auth.ok()).toBe(true);
  const headers = { Authorization: 'Bearer ' + (await auth.json()).accessToken };
  const get = async (path: string) => {
    const r = await page.request.get('/api/v1' + path, { headers });
    expect(r.ok(), path + ' ' + (await r.text())).toBe(true);
    return r.json();
  };
  const post = async (path: string, data: unknown) => {
    const r = await page.request.post('/api/v1' + path, { headers, data });
    expect(r.ok(), path + ' ' + (await r.text())).toBe(true);
    return r.json();
  };
  const uuid = () => crypto.randomUUID();
  const party = await post('/parties', {
    legalName: 'Finanzas API real',
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
    operation: 'OV',
    validFrom: '2000-01-01T00:00:00Z',
    validTo: null,
  });
  const yard = (await get('/yards'))[0];
  const site = await post('/inventory/sites', {
    parentUuid: null,
    code: 'FIN_SITE',
    name: 'Sitio finanzas',
    type: 'OTHER',
    operatorUuid: party.uuid,
    address: 'Prueba aislada',
    latitude: null,
    longitude: null,
    active: true,
  });
  if (!(await get('/finance/currencies')).some((c: any) => c.code === 'MXN'))
    await post('/finance/currencies', {
      uuid: uuid(),
      code: 'MXN',
      name: 'Peso mexicano',
      fractionDigits: 2,
    });
  let order = await post('/commercial/orders', {
    uuid: uuid(),
    type: 'OV',
    series: 'FIN',
    folio: 'LIVE-001',
    partyUuid: party.uuid,
    yardUuid: yard.uuid,
    currency: 'MXN',
    orderedAt: new Date().toISOString(),
    avlScope: 'GENERAL',
    termsUuid: null,
    termsReference: 'Términos de prueba',
    purchase: null,
    rental: null,
    sale: {
      destinationSiteUuid: site.uuid,
      deliveryTerms: 'Sitio',
      ownershipTransferTerms: 'Tras recepción',
    },
  });
  const line = await post('/commercial/orders/' + order.uuid + '/lines', {
    orderVersion: order.version,
    line: {
      uuid: uuid(),
      lineNumber: 1,
      kind: 'SERVICE',
      modelUuid: null,
      concept: 'Servicio completado real',
      quantity: '1',
      unit: 'SERVICE',
      unitPrice: '100.00',
      discountFraction: '0',
      taxFraction: '0.16',
    },
  });
  order = (await get('/commercial/orders/' + order.uuid)).order;
  order = await post('/commercial/orders/' + order.uuid + '/approve', { version: order.version });
  await post('/commercial/lines/' + line.uuid + '/complete-service', {
    reference: 'Servicio terminado',
    version: line.version,
  });
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/inicio/);
  await page.goto('/finanzas/cargos');
  await page.getByRole('button', { name: 'Registrar cargo' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Orden', exact: true }).selectOption(order.uuid);
  await dialog
    .getByRole('combobox', { name: 'Fuente cumplida', exact: true })
    .selectOption(line.uuid);
  await dialog.getByLabel('Referencia', { exact: true }).fill('Cargo real cumplido');
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const charge = (await get('/finance/charges/directory?orderUuid=' + order.uuid))[0].record;
  expect(charge.netAmountExact).toBe('100.00');
  await page.goto('/finanzas/facturas/nueva');
  await page.getByLabel('Serie', { exact: true }).fill('ADM');
  await page.getByLabel('Folio', { exact: true }).fill('FIN-LIVE-001');
  await page.getByRole('combobox', { name: 'Tercero', exact: true }).selectOption(party.uuid);
  await page.getByLabel('Referencia', { exact: true }).fill('Factura API real');
  await page
    .getByRole('combobox', { name: 'Cargo disponible', exact: true })
    .selectOption(charge.uuid);
  await page.getByRole('button', { name: 'Agregar fuente' }).click();
  await page.getByLabel('Neto de fuente 1').fill('100.00');
  await page.getByRole('button', { name: 'Calcular vista previa' }).click();
  await expect(
    page.getByRole('heading', { name: 'Vista previa calculada por el servidor' }),
  ).toBeVisible();
  const creation = page.waitForRequest(
    (r) => r.method() === 'POST' && r.url().endsWith('/finance/invoices'),
  );
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Guardar DRAFT' }).click();
  const invoicePayload = (await creation).postDataJSON();
  await expect(page).toHaveURL(/facturas\/[a-f0-9-]{36}\/resumen/);
  const invoiceUuid = invoicePayload.uuid;
  expect((await get('/finance/invoices/' + invoiceUuid + '/summary')).invoice.state).toBe('DRAFT');
  await page.getByRole('button', { name: 'Confirmar factura' }).click();
  dialog = page.getByRole('dialog');
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect((await get('/finance/invoices/' + invoiceUuid + '/summary')).balanceExact).toBe('116.00');
  await page.goto('/finanzas/pagos');
  await page.getByRole('button', { name: 'Registrar pago' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Tercero', exact: true }).selectOption(party.uuid);
  await dialog.getByLabel('Importe', { exact: true }).fill('100.00');
  await dialog.getByLabel('Referencia de operación').fill('FIN-PAY-LIVE-001');
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const payment = (await get('/finance/payments/directory?partyUuid=' + party.uuid))[0].record;
  await page.goto('/finanzas/facturas/' + invoiceUuid);
  await page.getByRole('button', { name: 'Aplicar pago' }).click();
  dialog = page.getByRole('dialog');
  await dialog
    .getByRole('combobox', { name: 'Pago con remanente', exact: true })
    .selectOption(payment.uuid);
  await dialog.getByLabel('Importe a aplicar').fill('20.00');
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect((await get('/finance/invoices/' + invoiceUuid + '/summary')).balanceExact).toBe('96.00');
  await page.getByRole('link', { name: 'Preparar nota de crédito' }).click();
  await page.getByLabel('Folio de nota').fill('NC-LIVE-001');
  await page.getByLabel('Motivo').fill('Descuento administrativo');
  const invoiceLine = (await get('/finance/invoices/' + invoiceUuid + '/lines'))[0].record;
  await page
    .getByRole('combobox', { name: 'Partida de factura', exact: true })
    .selectOption(invoiceLine.uuid);
  await page.getByRole('button', { name: 'Agregar fuente' }).click();
  await page.getByLabel('Neto de fuente 1').fill('10.00');
  await page.getByRole('button', { name: 'Calcular vista previa' }).click();
  await expect(
    page.getByRole('heading', { name: 'Vista previa calculada por el servidor' }),
  ).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Confirmar nota de crédito' }).click();
  await expect(page).toHaveURL(/notas\//);
  const note = (await get('/finance/invoices/' + invoiceUuid + '/notes'))[0].record;
  expect((await get('/finance/invoices/' + invoiceUuid + '/summary')).balanceExact).toBe('84.40');
  await page.getByRole('button', { name: 'Revertir nota' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Motivo').fill('Nota registrada incorrectamente');
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect((await get('/finance/invoices/' + invoiceUuid + '/summary')).balanceExact).toBe('96.00');
  await page.goto('/finanzas/terceros/' + party.uuid + '/credito');
  await page.getByRole('button', { name: 'Crear cuenta DRAFT' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Límite', { exact: true }).fill('1000.00');
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Revisar activación' }).click();
  await expect(page.getByRole('heading', { name: 'Sin bloqueos actuales' })).toBeVisible();
  await page.getByRole('button', { name: 'Activar o reactivar' }).click();
  dialog = page.getByRole('dialog');
  page.once('dialog', (d) => d.accept());
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const summary = await get('/finance/parties/' + party.uuid + '/summary?currency=MXN');
  expect(summary.account.state).toBe('ACTIVE');
  expect(summary.balances.exposureExact).toBe('96.00');
  await page.goto('/finanzas/terceros/' + party.uuid + '/evidencias');
  await page
    .getByLabel('Archivo', { exact: true })
    .setInputFiles({
      name: 'finance.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nFinance\n%%EOF'),
    });
  await page.getByRole('button', { name: 'Cargar explícitamente' }).click();
  await expect(page.getByText('finance.pdf', { exact: true })).toBeVisible();
  const file = (await get('/finance/evidence?partyUuid=' + party.uuid + '&offset=0&limit=25'))[0]
    .record;
  expect(file.storageKey).toBeUndefined();
  const download = await page.request.get('/api/v1/finance/evidence/' + file.uuid + '/content', {
    headers,
  });
  expect(download.ok()).toBe(true);
  await fs.writeFile(
    process.env['TRACECORE_E2E_FINANCE_RECOVERY_FILE']!,
    JSON.stringify({
      partyUuid: party.uuid,
      invoiceUuid,
      invoicePayload,
      paymentUuid: payment.uuid,
      noteUuid: note.uuid,
      evidenceUuid: file.uuid,
      accountUuid: summary.account.uuid,
    }),
  );
}
