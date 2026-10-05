import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { vi } from 'vitest';
import { Session } from '../../core/auth/session';
import { InventoryApi } from './inventory-api';
export function inventoryTestProviders() {
  const context = signal({
    company: { uuid: 'company', name: 'TraceCore', timezone: 'UTC', active: true },
    companyPermissions: ['INVENTORY_READ'],
    yards: [] as { uuid: string; permissions: string[] }[],
  });
  const ended = new Subject<void>();
  const session = {
    context,
    ended,
    epoch: signal(0),
    selectedYard: signal(''),
    valid: () => true,
    can: (p: string, y?: string) =>
      y
        ? !!context()
            .yards.find((row) => row.uuid === y)
            ?.permissions.includes(p)
        : context().companyPermissions.includes(p),
  };
  const api = {
    get: vi.fn(async (path: string) =>
      path === '/locations/overview'
        ? { path: [], items: [] }
        : path.includes('/assets/')
          ? {
              asset: { uuid: 'asset', internalCode: 'Equipo', lifecycle: 'REGISTERED' },
              assignment: null,
              custody: null,
              transit: null,
              placementState: 'UNLOCATED',
            }
          : path.includes('/movements/')
            ? { movement: { uuid: 'move', state: 'DRAFT' }, items: [], logisticsManaged: false }
            : path.includes('/proposals/')
              ? { proposal: { uuid: 'proposal', state: 'EXPIRED' }, items: [], decision: null }
              : path.includes('/reservations/')
                ? { reservation: { uuid: 'reservation', state: 'EXPIRED' }, memberCount: 0 }
                : path.includes('/counts/') && !path.endsWith('/items')
                  ? { uuid: 'count', state: 'CLOSED' }
                  : [],
    ),
    post: vi.fn(),
    put: vi.fn(),
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
      { provide: InventoryApi, useValue: api },
      { provide: Dialog, useValue: { open: () => ({ closed: of(false) }), closeAll: vi.fn() } },
      { provide: DialogRef, useValue: { close: vi.fn() } },
      {
        provide: DIALOG_DATA,
        useValue: {
          yardUuid: 'yard',
          parentUuid: null,
          profile: { asset: { uuid: 'asset' }, custody: null },
        },
      },
    ],
  };
}
