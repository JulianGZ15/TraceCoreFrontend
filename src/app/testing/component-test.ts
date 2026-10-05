import { TestBed } from '@angular/core/testing';
import { Type, importProvidersFrom, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DialogModule, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Api } from '../core/http/api';
import { Session } from '../core/auth/session';
import { Subject } from 'rxjs';
import { AssetStore } from '../features/equipment/asset-store';
export const company = {
  uuid: '00000000-0000-0000-0000-000000000001',
  legalName: 'TraceCore Test',
  name: 'TraceCore Test',
  country: 'MX',
  timezone: 'America/Mexico_City',
  active: true,
  version: 0,
};
const user = {
  uuid: '00000000-0000-0000-0000-000000000002',
  name: 'Ana Administradora',
  email: 'ana@example.test',
  active: true,
  version: 0,
};
export async function render<T>(component: Type<T>, inputs: Record<string, unknown> = {}) {
  const session = {
    epoch: signal(0),
    ended: new Subject<void>(),
    inventoryRead: () => false,
    qualityRead: () => false,
    commerceRead: () => false,
    commerceWrite: () => false,
    rfidRead: () => false,
    rfidWrite: () => false,
    qualityWrite: () => false,
    inventoryWrite: () => false,
    user: signal(user),
    context: signal({
      company,
      companyPermissions: ['ORGANIZATION_READ', 'ACCESS_MANAGE'],
      yards: [],
    }),
    selectedYard: signal(''),
    notice: signal(''),
    can: () => true,
    valid: () => false,
    logout: () => {},
    selectYard: async () => {},
  };
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      importProvidersFrom(DialogModule),
      { provide: Session, useValue: session },
      {
        provide: AssetStore,
        useValue: { profile: signal(null), uuid: '', load: async () => {}, dispose: () => {} },
      },
      {
        provide: Api,
        useValue: {
          get: async (p: string) => (p === '/company' ? company : []),
          all: async () => [],
          post: async () => ({}),
          put: async () => company,
        },
      },
      {
        provide: DIALOG_DATA,
        useValue: {
          ...user,
          title: 'Formulario de prueba',
          fields: [],
          kind: 'categories',
          path: 'categories',
          save: async () => true,
          zone: 'UTC',
          event: {
            uuid: 'event',
            action: 'UPDATE',
            resourceType: 'USER',
            resourceUuid: 'resource',
            correlationUuid: 'correlation',
            occurredAt: '2026-10-03T12:00:00Z',
            recordedAt: '2026-10-03T12:00:00Z',
            changedFields: ['name'],
          },
        },
      },
      { provide: DialogRef, useValue: { close: () => {} } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  await fixture.whenStable();
  return fixture;
}
