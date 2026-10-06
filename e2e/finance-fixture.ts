import { Page } from '@playwright/test';
import { fixtureApi, ids } from './api-fixture';
export const fids = {
  party: '90000000-0000-4000-8000-000000000001',
  invoice: '90000000-0000-4000-8000-000000000002',
  charge: '90000000-0000-4000-8000-000000000003',
  payment: '90000000-0000-4000-8000-000000000004',
  account: '90000000-0000-4000-8000-000000000005',
  line: '90000000-0000-4000-8000-000000000006',
  commitment: '90000000-0000-4000-8000-000000000007',
};
export async function financeFixture(
  page: Page,
  profile: 'manager' | 'reader' | 'yard' | 'writer' = 'manager',
) {
  const auth = await fixtureApi(page);
  const codes =
    profile === 'reader'
      ? ['FINANCE_READ']
      : profile === 'writer'
        ? ['FINANCE_CREDIT']
        : ['FINANCE_READ', 'FINANCE_MANAGE', 'FINANCE_APPROVE', 'FINANCE_CREDIT'];
  const state = {
    writes: [] as { path: string; body: any }[],
    conflict: false,
    loseResponse: false,
    invoice: {
      uuid: fids.invoice,
      version: 1,
      partyUuid: fids.party,
      series: 'ADM',
      folio: 'FIN-001',
      direction: 'RECEIVABLE',
      currency: 'MXN',
      fractionDigits: 8,
      state: 'DRAFT',
      issuedAt: '2026-01-01T00:00:00Z',
      dueAt: '2026-12-01T00:00:00Z',
      reference: 'Factura administrativa',
      netAmountExact: '99999999999999.99999999',
      taxAmountExact: '0.00000000',
      totalAmountExact: '99999999999999.99999999',
      snapshot: null,
    },
    payment: {
      uuid: fids.payment,
      version: 0,
      partyUuid: fids.party,
      currency: 'MXN',
      direction: 'RECEIVABLE',
      fractionDigits: 8,
      amountExact: '100.00000000',
      operationReference: 'TRANSFER-001',
      method: 'TRANSFER',
      paidAt: '2026-01-01T00:00:00Z',
    },
    account: {
      uuid: fids.account,
      version: 1,
      partyUuid: fids.party,
      currency: 'MXN',
      fractionDigits: 8,
      state: 'DRAFT',
      creditLimitExact: '1000.00000000',
      validFrom: '2000-01-01T00:00:00Z',
      validTo: null,
    },
    created: new Map<string, any>(),
  };
  const invoice = () => ({
    invoice: state.invoice,
    balanceExact: '99999999999999.99999999',
    creditedExact: '0.00000000',
    paidExact: '0.00000000',
    reversed: false,
    lines: [
      {
        uuid: fids.line,
        invoiceUuid: state.invoice.uuid,
        version: 0,
        number: 1,
        concept: 'Servicio completado',
        netAmountExact: '99999999999999.99999999',
        taxAmountExact: '0.00000000',
        taxFractionExact: '0',
      },
    ],
    charges: [
      { uuid: fids.charge, chargeUuid: fids.charge, netAmountExact: '99999999999999.99999999' },
    ],
  });
  const row = (record: any) => ({
    record,
    label: 'Tercero de prueba · expediente financiero',
    uuid: record.uuid,
  });
  const charge = {
    uuid: fids.charge,
    version: 0,
    partyUuid: fids.party,
    direction: 'RECEIVABLE',
    currency: 'MXN',
    fractionDigits: 8,
    concept: 'Servicio completado',
    kind: 'SERVICE',
    netAmountExact: '99999999999999.99999999',
    taxAmountExact: '0.00000000',
    remainingNetExact: '99999999999999.99999999',
    remainingTaxExact: '0.00000000',
  };
  await page.route('**/api/v1/auth/context', (route) =>
    route.fulfill({
      json: {
        company: auth.company,
        companyPermissions: profile === 'yard' ? [] : codes,
        yards: profile === 'yard' ? [{ ...auth.yards[0], permissions: codes }] : [],
      },
    }),
  );
  await page.route('**/api/v1/finance/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      p = url.pathname.replace('/api/v1/finance', ''),
      body = request.postData() ? request.postDataJSON() : null;
    const respond = (json: unknown, status = 200) => route.fulfill({ status, json });
    if (request.method() === 'GET') {
      if (p === '/currencies')
        return respond([
          {
            uuid: fids.account,
            version: 0,
            code: 'MXN',
            name: 'Divisa de prueba',
            fractionDigits: 8,
            active: true,
          },
        ]);
      if (p.startsWith('/requests/')) {
        const record = state.created.get(p.split('/').pop()!);
        return respond(record ?? {}, record ? 200 : 404);
      }
      if (p === '/party-options')
        return respond([{ uuid: fids.party, label: 'Tercero de prueba', active: true }]);
      if (p === '/order-options')
        return respond([
          {
            uuid: fids.commitment,
            label: 'OV-001 · Tercero',
            currency: 'MXN',
            payerUuid: fids.party,
          },
        ]);
      if (p === '/charge-options') return respond([row(charge)]);
      if (p === '/invoice-options') return respond([row(state.invoice)]);
      if (p === '/payment-options') return respond([row(state.payment)]);
      if (p === '/charge-origins')
        return respond([{ uuid: fids.line, label: 'Servicio cumplido' }]);
      if (p.endsWith('/activation-check') || p.endsWith('/settlement-check'))
        return respond({
          allowed: true,
          blockers: [],
          evaluatedAt: '2026-01-01T00:00:00Z',
          projectedExposureExact: '116.00',
        });
      if (p.startsWith('/parties/'))
        return respond({
          party: { uuid: fids.party, legalName: 'Tercero de prueba', active: true },
          currency: 'MXN',
          fractionDigits: 8,
          account: state.account,
          balances: {
            receivableExact: '116.00',
            payableExact: '0.00',
            overdueReceivableExact: '116.00',
            overduePayableExact: '0.00',
            incomingUnappliedExact: '100.00',
            outgoingUnappliedExact: '0.00',
            commitmentsExact: '0.00',
            exposureExact: '116.00',
            creditLimitExact: '1000.00',
            availableCreditExact: '884.00',
          },
          creditEnabled: false,
          accountInPeriod: true,
          evaluatedAt: '2026-01-01T00:00:00Z',
        });
      if (p === '/invoices/directory') return respond([row(state.invoice)]);
      if (p === '/payments/directory')
        return respond([row({ ...state.payment, unappliedExact: '100.00000000' })]);
      if (p === '/charges/directory') return respond([row(charge)]);
      if (p === '/credit-accounts/directory') return respond([row(state.account)]);
      if (p.includes('/invoices/')) {
        if (p.endsWith('/lines')) return respond(invoice().lines.map(row));
        if (p.endsWith('/charges')) return respond(invoice().charges.map(row));
        if (p.endsWith('/applications') || p.endsWith('/notes')) return respond([]);
        return respond(invoice());
      }
      if (p.includes('/payments/'))
        return respond(
          p.endsWith('/applications')
            ? []
            : { payment: state.payment, unappliedExact: '100.00000000', reversed: false },
        );
      if (p.includes('/credit-accounts/'))
        return respond(p.endsWith('/limit-changes') ? [] : state.account);
      if (p.includes('/credit-reservations/'))
        return respond(
          p.endsWith('/history')
            ? []
            : {
                uuid: fids.commitment,
                version: 1,
                orderUuid: fids.commitment,
                approvedAmountExact: '116.00',
                currency: 'MXN',
                released: false,
              },
        );
      if (p.endsWith('/summary'))
        return respond({
          uuid: fids.commitment,
          currency: 'MXN',
          payerUuid: fids.party,
          commitment: null,
        });
      return respond([]);
    }
    if (p.endsWith('/preview'))
      return respond({
        parts: body.parts.map((v: any) => ({
          sourceUuid: v.chargeUuid ?? v.invoiceLineUuid,
          concept: 'Servicio completado',
          netAmountExact: v.netAmount,
          taxAmountExact: '0.00000000',
          taxFractionExact: '0',
          remainingNetExact: '99999999999999.99999999',
          remainingTaxExact: '0.00000000',
        })),
        currency: 'MXN',
        fractionDigits: 8,
        netAmountExact: body.parts[0].netAmount,
        taxAmountExact: '0.00000000',
        totalAmountExact: body.parts[0].netAmount,
        calculationFingerprint: 'current-calculation',
      });
    state.writes.push({ path: p, body });
    if (state.conflict) return respond({ code: 'CONFLICT', message: 'Resource changed' }, 409);
    let result: any = { uuid: body.uuid, version: 0 };
    if (p === '/invoices') {
      Object.assign(state.invoice, { ...body, state: 'DRAFT', version: 0 });
      result = invoice();
    } else if (p === '/payments') {
      Object.assign(state.payment, body);
      result = { payment: state.payment, unappliedExact: body.amount, reversed: false };
    } else if (p.endsWith('/limit')) {
      state.account.creditLimitExact = body.creditLimit;
      state.account.version++;
      result = state.account;
    } else if (p.endsWith('/cancel')) {
      state.invoice.state = 'CANCELLED';
      state.invoice.version++;
      result = invoice();
    } else if (p.endsWith('/post')) {
      state.invoice.state = 'POSTED';
      state.invoice.version++;
      result = invoice();
    }
    if (body.uuid) state.created.set(body.uuid, result);
    if (state.loseResponse) {
      state.loseResponse = false;
      return route.abort('failed');
    }
    return respond(result);
  });
  return state;
}
