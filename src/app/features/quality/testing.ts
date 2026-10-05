import { signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { vi } from 'vitest';
import { Session } from '../../core/auth/session';
import { QualityApi } from './quality-api';
export const testAsset = {
  uuid: '00000000-0000-4000-8000-000000000001',
  internalCode: 'Q-001',
  serialNumber: null,
  lifecycle: 'REGISTERED',
  categoryUuid: 'cat',
  categoryCode: 'CAT',
  modelUuid: 'model',
  modelCode: 'MOD',
  sheetUuid: 'sheet',
  sheetRevision: 'A',
  condition: 'UNKNOWN',
  yardUuid: null,
  registeredAt: '2026-01-01T00:00:00Z',
  version: 0,
};
export function qualityTestProviders() {
  const context = signal({
    company: { uuid: 'company', name: 'TraceCore', timezone: 'UTC', active: true },
    companyPermissions: ['QUALITY_READ'],
    yards: [] as { uuid: string; active: boolean; permissions: string[] }[],
  });
  const ended = new Subject<void>();
  const session = {
    context,
    ended,
    epoch: signal(0),
    user: signal({ uuid: 'actor', name: 'Actor' }),
    valid: () => true,
    can: (p: string, y?: string) =>
      y
        ? !!context()
            .yards.find((v) => v.uuid === y && v.active)
            ?.permissions.includes(p)
        : context().companyPermissions.includes(p),
    refresh: vi.fn(async () => {}),
  };
  const api = {
    get: vi.fn(async (path: string) => (path.endsWith('/summary') ? testAsset : [])),
    post: vi.fn(async (_path: string, _body: unknown, _key?: string) => ({
      uuid: 'result',
      version: 0,
    })),
    put: vi.fn(async () => ({ uuid: 'result', version: 1 })),
    upload: vi.fn(),
    download: vi.fn(),
  };
  return {
    session,
    api,
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({})),
          queryParamMap: of(convertToParamMap({})),
          snapshot: {
            paramMap: convertToParamMap({}),
            queryParamMap: convertToParamMap({}),
            data: {},
          },
        },
      },
      { provide: Session, useValue: session },
      { provide: QualityApi, useValue: api },
      { provide: Dialog, useValue: { open: () => ({ closed: of(false) }), closeAll: vi.fn() } },
      { provide: DialogRef, useValue: { close: vi.fn() } },
      {
        provide: DIALOG_DATA,
        useValue: { assetUuid: testAsset.uuid, orderUuid: 'order', orderVersion: 0 },
      },
    ],
  };
}
