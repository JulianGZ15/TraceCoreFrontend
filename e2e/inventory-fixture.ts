import { Page } from '@playwright/test';
export const id = (n: number) => '10000000-0000-0000-0000-' + String(n).padStart(12, '0');
export async function inventoryFixture(page: Page, scoped = false) {
  const yard = id(1),
    company = id(2),
    asset = id(3),
    location = id(4),
    move = id(5),
    count = id(6),
    proposal = id(7),
    reservation = id(8);
  const permissions = [
    'INVENTORY_READ',
    'INVENTORY_MANAGE',
    'MOVEMENT_MANAGE',
    'DISPATCH_APPROVE',
    'INVENTORY_ADJUST',
    'RESERVATION_MANAGE',
    'CUSTODY_MANAGE',
    'INVENTORY_OBSERVE',
    'REPAIR_DISPATCH',
  ];
  const user = {
    uuid: id(9),
    name: 'Operador Inventario',
    email: 'inventory@example.test',
    active: true,
    version: 0,
  };
  const loc = {
    uuid: location,
    yardUuid: yard,
    parentUuid: null,
    code: 'BAY-A',
    name: 'Bahía de prueba con nombre largo',
    type: 'BAY',
    active: true,
    maxPositions: 10,
    maxWeightKg: 1000,
    maxWeightKgExact: '1000.000000',
    exclusive: false,
    version: 0,
  };
  const root = {
    uuid: asset,
    internalCode: 'ROOT-01',
    serialNumber: null,
    lifecycle: 'REGISTERED',
    rootAssetUuid: asset,
    yardUuid: yard,
    locationUuid: location,
    siteUuid: null,
    transitMovementUuid: null,
    placementState: 'YARD',
  };
  const state = {
    receiveConflict: false,
    requests: [] as { path: string; body: Record<string, unknown> }[],
    logisticsManaged: false,
    movement: {
      uuid: move,
      folio: 'MOV-01',
      type: 'TRANSFER',
      state: 'DRAFT',
      sourceYardUuid: yard,
      destinationYardUuid: yard,
      sourceSiteUuid: null,
      destinationSiteUuid: null,
      destinationCustodyMode: 'STORAGE',
      reason: 'Traslado',
      sourceReference: 'REF-01',
      createdOn: '2026-01-01T12:00:00Z',
      dispatchedAt: null as string | null,
      receivedAt: null as string | null,
      version: 0,
    },
    items: [
      {
        uuid: id(10),
        assetUuid: asset,
        rootAssetUuid: asset,
        destinationLocationUuid: location,
        destinationSiteUuid: null,
        actualDestinationLocationUuid: null as string | null,
        grossWeightKg: 10,
        grossWeightKgExact: '10.000000',
        weightReference: 'Báscula',
        reservationUuid: null,
        receivedCondition: null,
        receptionReason: null,
        version: 0,
      },
    ],
    count: {
      uuid: count,
      folio: 'CNT-01',
      yardUuid: yard,
      locationUuid: null,
      method: 'MANUAL',
      state: 'OPEN',
      openedAt: '2026-01-01T00:00:00Z',
      expectedCount: 1,
      sourceReference: 'Conteo prueba',
      version: 0,
    },
    countItems: [
      {
        uuid: id(11),
        assetUuid: asset,
        expectedLocationUuid: location,
        observedLocationUuid: null as string | null,
        expected: true,
        observed: false,
        observedIdentifier: null as string | null,
        difference: 'MISSING',
        resolution: null as string | null,
        version: 0,
      },
    ],
    proposal: {
      uuid: proposal,
      type: 'TRANSFER',
      state: 'PENDING',
      sourceYardUuid: yard,
      destinationYardUuid: yard,
      destinationSiteUuid: null,
      destinationCustodyMode: 'STORAGE',
      sourceReference: 'Propuesta manual',
      reason: 'Conciliar',
      proposedAt: '2026-01-01T12:00:00Z',
      expiresAt: '2050-01-01T00:00:00Z',
      version: 0,
    },
    decision: null as Record<string, unknown> | null,
  };
  const reserve = {
    uuid: reservation,
    requestKey: id(20),
    rootAssetUuid: asset,
    assetUuid: asset,
    yardUuid: yard,
    beneficiaryUuid: null,
    validFrom: '2040-01-01T00:00:00Z',
    validTo: '2040-02-01T00:00:00Z',
    expiresAt: '2040-01-01T00:00:00Z',
    state: 'HELD',
    requestReference: 'Reserva prueba',
    version: 0,
  };
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace('/api/v1', ''),
      body = req.postDataJSON() as Record<string, unknown> | null;
    const reply = (v: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(v) });
    if (path === '/auth/login')
      return reply({
        accessToken: 'inventory-fixture',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        user,
      });
    if (!req.headers()['authorization']) return reply({ code: 'UNAUTHORIZED' }, 401);
    if (path === '/auth/me') return reply(user);
    if (path === '/auth/context')
      return reply({
        company: { uuid: company, name: 'TraceCore', timezone: 'UTC', active: true },
        companyPermissions: scoped ? [] : permissions,
        yards: [
          {
            uuid: yard,
            companyUuid: company,
            code: 'YARD-A',
            name: 'Patio de prueba',
            timezone: 'UTC',
            active: true,
            permissions: scoped ? permissions : [],
          },
        ],
      });
    if (req.method() !== 'GET') state.requests.push({ path, body: body ?? {} });
    if (path === '/inventory/assets') return reply([root]);
    if (path === '/inventory/locations/overview')
      return reply({
        path: [],
        items: [
          {
            location: loc,
            occupancy: {
              locationUuid: location,
              positions: 1,
              identifiedPieces: 1,
              knownWeightKgExact: '10.000000',
              unknownWeightGroups: 0,
              maxPositions: 10,
              maxWeightKgExact: '1000.000000',
              positionPercentExact: '10.00',
            },
          },
        ],
      });
    if (path === '/inventory/locations') return reply([loc]);
    if (path === '/inventory/locations/' + location) return reply(loc);
    if (path === '/inventory/locations/' + location + '/occupancy')
      return reply({
        locationUuid: location,
        positions: 1,
        identifiedPieces: 1,
        knownWeightKgExact: '10.000000',
        unknownWeightGroups: 0,
        maxPositions: 10,
        maxWeightKgExact: '1000.000000',
        positionPercentExact: '10.00',
      });
    if (path === '/inventory/party-options') return reply([]);
    if (path === '/inventory/sites') return reply([]);
    if (path === '/inventory/assets/' + asset)
      return reply({
        asset: { ...root, version: 0, referenceValue: null, referenceValueExact: null },
        assignment: {
          ...state.items[0],
          uuid: id(30),
          locationUuid: location,
          siteUuid: null,
          validFrom: '2026-01-01T00:00:00Z',
          validTo: null,
        },
        custody: {
          uuid: id(31),
          companyUuid: company,
          partyUuid: null,
          yardUuid: yard,
          mode: 'STORAGE',
          version: 0,
        },
        transit: null,
        placementState: 'YARD',
      });
    if (path.endsWith('/availability'))
      return reply({ administrativelyAvailable: true, reasons: [] });
    if (path.endsWith('/custody') || path.endsWith('/locations')) return reply([]);
    if (path === '/inventory/movements') {
      if (body) {
        Object.assign(state.movement, {
          type: body['type'],
          state: 'DRAFT',
          reason: body['reason'],
          sourceReference: body['sourceReference'],
        });
        return reply(
          {
            movement: state.movement,
            items: state.items,
            logisticsManaged: state.logisticsManaged ?? false,
          },
          201,
        );
      }
      return reply([state.movement]);
    }
    if (path === '/inventory/movements/' + move)
      return reply({
        movement: state.movement,
        items: state.items,
        logisticsManaged: state.logisticsManaged ?? false,
      });
    if (path.endsWith('/dispatch')) {
      Object.assign(state.movement, { state: 'COMPLETED', version: 1 });
      return reply({
        movement: state.movement,
        items: state.items,
        logisticsManaged: state.logisticsManaged ?? false,
      });
    }
    if (path.endsWith('/receive')) {
      if (state.receiveConflict) {
        state.receiveConflict = false;
        return reply({ code: 'CONFLICT' }, 409);
      }
      Object.assign(state.movement, {
        state: 'COMPLETED',
        receivedAt: new Date().toISOString(),
        version: 2,
      });
      return reply({
        movement: state.movement,
        items: state.items,
        logisticsManaged: state.logisticsManaged ?? false,
      });
    }
    if (path === '/inventory/reservations') return reply(body ? [reserve] : [reserve]);
    if (path === '/inventory/reservations/' + reservation)
      return reply({ reservation: reserve, memberCount: 1 });
    if (path === '/inventory/reservations/' + reservation + '/members') return reply([reserve]);
    if (path === '/inventory/reservations/' + reservation + '/confirm') {
      Object.assign(reserve, { state: 'CONFIRMED', version: 1 });
      return reply([reserve]);
    }
    if (path === '/inventory/proposals')
      return reply(
        body ? { proposal: state.proposal, items: [], decision: null } : [state.proposal],
      );
    if (path === '/inventory/proposals/' + proposal)
      return reply({
        proposal: state.proposal,
        items: [
          {
            uuid: id(40),
            assetUuid: asset,
            rootAssetUuid: asset,
            expected: true,
            observed: false,
            accepted: null,
          },
        ],
        decision: state.decision,
      });
    if (path.endsWith('/decide')) {
      state.decision = {
        uuid: id(41),
        action: body!['action'],
        reason: body!['reason'],
        movementUuid: move,
      };
      state.proposal.state = 'CONFIRMED';
      return reply(state.decision);
    }
    if (path === '/inventory/counts') return reply(body ? state.count : [state.count]);
    if (path === '/inventory/counts/' + count) return reply(state.count);
    if (path === '/inventory/counts/' + count + '/items') return reply(state.countItems);
    if (path.endsWith('/observe')) {
      const item = {
        uuid: id(12),
        assetUuid: null as unknown as string,
        expectedLocationUuid: null as unknown as string,
        observedLocationUuid: location,
        expected: false,
        observed: true,
        observedIdentifier: body!['identifier'] as string,
        difference: 'UNKNOWN',
        resolution: null as string | null,
        version: 0,
      };
      state.countItems.push(item);
      return reply(item);
    }
    if (path.endsWith('/resolve')) {
      const uuid = path.split('/').at(-2);
      const r = state.countItems.find((r) => r.uuid === uuid)!;
      r.resolution = String(body!['resolution']);
      return reply(r);
    }
    if (path.endsWith('/close')) {
      if (state.countItems.some((r) => !r.resolution)) return reply({ code: 'CONFLICT' }, 409);
      state.count.state = 'CLOSED';
      return reply(state.count);
    }
    return reply({ code: 'NOT_FOUND' }, 404);
  });
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill('FixtureOnly123!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.waitForURL('**/inicio');
  return { state, yard, asset, location, move, count, proposal, reservation };
}
