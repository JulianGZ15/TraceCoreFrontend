import { TestBed } from '@angular/core/testing';
import { Type, signal, importProvidersFrom } from '@angular/core';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DialogModule, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Subject, of } from 'rxjs';
import { Session } from '../../core/auth/session';
import { LogisticsApi } from './logistics-api';
export const testId = '80000000-0000-4000-8000-000000000001';
export const testSummary = {
  manifest: {
    uuid: testId,
    version: 1,
    folio: 'LOG-001',
    yardUuid: testId,
    sourceYardUuid: testId,
    destinationSiteUuid: testId,
    state: 'DRAFT',
    type: 'OUTBOUND',
  },
  trip: null,
  labels: { origin: 'Patio', destination: 'Sitio' },
  rootCount: 2,
  pieceCount: 3,
  deliveredRootCount: 0,
  totalWeightKgExact: '999999999999.999999',
  unknownWeightRoots: 0,
  carrierUuid: testId,
};
export async function renderLogistics<T>(type: Type<T>, inputs: Record<string, unknown> = {}) {
  sessionStorage.removeItem('tracecore.logistics.pending');
  sessionStorage.removeItem('tracecore.logistics.draft');
  const session = {
    epoch: signal(0),
    ended: new Subject<void>(),
    user: signal({ uuid: testId, name: 'Lector' }),
    context: signal({
      company: { uuid: testId, name: 'Prueba', timezone: 'UTC', active: true },
      companyPermissions: ['LOGISTICS_READ'],
      yards: [
        { uuid: testId, active: true, name: 'Patio', code: 'PT', timezone: 'UTC', permissions: [] },
      ],
    }),
    selectedYard: signal(testId),
    can: (p: string) => p === 'LOGISTICS_READ',
    valid: () => true,
    refresh: async () => {},
  };
  const row = {
    uuid: testId,
    version: 1,
    manifestUuid: testId,
    carrierUuid: testId,
    name: 'Vehículo',
    type: 'TRUCK',
    maxWeightKgExact: '999999999999.999999',
    maxPositions: 2,
    plate: 'ABC',
    plannedDeparture: '2026-10-05T12:00:00Z',
    eta: '2026-10-05T14:00:00Z',
    expected: [],
    observed: [],
    missing: [],
    extra: [],
    unresolvedEvents: [],
  };
  const api = {
    session,
    get: async (path: string) =>
      path.endsWith('/summary')
        ? testSummary
        : path.endsWith('/verification-context')
          ? { expected: [], eventUuids: [], sessionUuid: null, receiptCount: 0 }
          : /\/(?:checks|receipts|vehicles|drivers)\/[a-f0-9-]{36}$/.test(path)
            ? row
            : [],
    post: async () => {
      throw new Error('Lectura exclusiva');
    },
    put: async () => {
      throw new Error('Lectura exclusiva');
    },
  };
  const params = convertToParamMap({ uuid: testId }),
    query = convertToParamMap({ yardUuid: testId });
  await TestBed.configureTestingModule({
    imports: [type],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      importProvidersFrom(DialogModule),
      { provide: Session, useValue: session },
      { provide: LogisticsApi, useValue: api },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: params, queryParamMap: query },
          paramMap: of(params),
          queryParamMap: of(query),
        },
      },
      { provide: DialogRef, useValue: { close: () => {} } },
      { provide: DIALOG_DATA, useValue: { yard: testId, row, summary: testSummary } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(type);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  await fixture.whenStable();
  return fixture;
}
