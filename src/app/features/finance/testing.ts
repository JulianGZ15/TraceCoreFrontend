import { TestBed } from '@angular/core/testing';
import { Type, signal, importProvidersFrom } from '@angular/core';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { DialogModule, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Subject, of } from 'rxjs';
import { Session } from '../../core/auth/session';
import { FinanceApi } from './finance-api';
export const fid = '90000000-0000-4000-8000-000000000001';
export const financeRow = {
  uuid: fid,
  version: 1,
  partyUuid: fid,
  code: 'MXN',
  name: 'Peso mexicano',
  active: true,
  fractionDigits: 2,
  currency: 'MXN',
  direction: 'RECEIVABLE',
  state: 'DRAFT',
  series: 'ADM',
  folio: 'F-001',
  reference: 'Referencia',
  creditLimitExact: '1000.00',
  approvedAmountExact: '116.00',
  amountExact: '10.00',
  netAmountExact: '100.00',
  taxAmountExact: '16.00',
  totalAmountExact: '116.00',
  issuedAt: '2026-01-01T00:00:00Z',
  dueAt: '2026-12-31T00:00:00Z',
  validFrom: '2000-01-01T00:00:00Z',
};
export const financeDetail = {
  invoice: financeRow,
  payment: financeRow,
  lines: [],
  charges: [],
  creditedExact: '0.00',
  paidExact: '0.00',
  balanceExact: '116.00',
  unappliedExact: '10.00',
  reversed: false,
};
export async function renderFinance<T>(
  type: Type<T>,
  inputs: Record<string, unknown> = {},
  codes = ['FINANCE_READ'],
) {
  sessionStorage.removeItem('tracecore.finance.pending');
  const session = {
    epoch: signal(0),
    ended: new Subject<void>(),
    user: signal({ uuid: fid, name: 'Lector' }),
    context: signal({
      company: { uuid: fid, name: 'Prueba', timezone: 'UTC', active: true },
      companyPermissions: codes,
      yards: [],
    }),
    can: (p: string) => codes.includes(p),
    valid: () => true,
    refresh: async () => {},
  };
  const api = {
    session,
    get: async (path: string) =>
      path === '/currencies'
        ? [financeRow]
        : path.startsWith('/parties/')
          ? {
              party: { uuid: fid, legalName: 'Tercero' },
              currency: 'MXN',
              fractionDigits: 2,
              account: financeRow,
              balances: {
                receivableExact: '116.00',
                payableExact: '0.00',
                overdueReceivableExact: '0.00',
                overduePayableExact: '0.00',
                incomingUnappliedExact: '10.00',
                outgoingUnappliedExact: '0.00',
                commitmentsExact: '0.00',
                exposureExact: '116.00',
                creditLimitExact: '1000.00',
                availableCreditExact: '884.00',
              },
              creditEnabled: false,
              accountInPeriod: true,
              evaluatedAt: '2026-01-01T00:00:00Z',
            }
          : path.endsWith('/summary')
            ? financeDetail
            : /\/credit-notes\/[a-f0-9-]{36}$/.test(path)
              ? { uuid: fid, note: financeRow, lines: [], reversed: false }
              : /\/(credit-accounts|credit-reservations|reversals)\/[a-f0-9-]{36}$/.test(path)
                ? financeRow
                : [],
    post: async (_path: string, _body: unknown): Promise<unknown> => {
      throw new Error('No debe escribir al consultar.');
    },
  };
  const params = convertToParamMap({ uuid: fid }),
    query = convertToParamMap({ currency: 'MXN' });
  await TestBed.configureTestingModule({
    imports: [type],
    providers: [
      provideRouter([]),
      importProvidersFrom(DialogModule),
      { provide: Session, useValue: session },
      { provide: FinanceApi, useValue: api },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: params, queryParamMap: query },
          paramMap: of(params),
          queryParamMap: of(query),
        },
      },
      { provide: DialogRef, useValue: { close: () => {} } },
      {
        provide: DIALOG_DATA,
        useValue: { row: financeRow, partyUuid: fid, currency: 'MXN', resource: 'invoices' },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(type);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  await fixture.whenStable();
  return { fixture, session, api };
}
