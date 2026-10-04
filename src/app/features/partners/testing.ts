import { TestBed } from '@angular/core/testing';
import { Type, signal, importProvidersFrom } from '@angular/core';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { DialogModule, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BehaviorSubject, Subject } from 'rxjs';
import { vi } from 'vitest';
import { PartnersApi } from './partners-api';
import { DossierStore } from './dossier-store';
import { Session } from '../../core/auth/session';
import { partyFields } from './record-fields';
export const testParty = {
  uuid: '00000000-0000-0000-0000-000000000010',
  legalName: 'Empresa de prueba',
  tradeName: null,
  country: 'MX',
  active: true,
  version: 2,
};
export const testSession = {
  can: vi.fn(() => true),
  valid: vi.fn(() => true),
  epoch: signal(0),
  ended: new Subject<void>(),
  context: signal({
    company: { uuid: 'company', name: 'TraceCore', active: true, timezone: 'UTC' },
    companyPermissions: ['PARTY_READ'],
    yards: [],
  }),
};
export async function renderPartner<T>(
  component: Type<T>,
  options: {
    inputs?: Record<string, unknown>;
    data?: object;
    rows?: object[];
    permissions?: string[];
  } = {},
) {
  testSession.can.mockImplementation((p?: string) =>
    options.permissions ? options.permissions.includes(p ?? '') : true,
  );
  testSession.valid.mockReturnValue(true);
  testSession.epoch.set(0);
  const api = {
    party: vi.fn(async (..._args: unknown[]) => testParty),
    directory: vi.fn(async (..._args: unknown[]) => [testParty]),
    list: vi.fn(async (..._args: unknown[]) => options.rows ?? []),
    yards: vi.fn(async (..._args: unknown[]) => []),
    find: vi.fn(async (..._args: unknown[]) => testParty),
    create: vi.fn(async (..._args: unknown[]) => testParty),
    update: vi.fn(async (..._args: unknown[]) => testParty),
    updateParty: vi.fn(async (..._args: unknown[]) => testParty),
    createParty: vi.fn(async (..._args: unknown[]) => testParty),
    upload: vi.fn(async (..._args: unknown[]) => testParty),
    download: vi.fn(async (..._args: unknown[]) => {}),
    action: vi.fn(async (..._args: unknown[]) => testParty),
    eligibility: vi.fn(async (..._args: unknown[]) => ({
      allowed: false,
      reason: 'ROLE_REQUIRED',
    })),
  };
  const store = {
    uuid: testParty.uuid,
    party: signal(testParty),
    roles: signal([]),
    load: vi.fn(async (..._args: unknown[]) => {}),
    dispose: vi.fn(),
  };
  const ref = { close: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      importProvidersFrom(DialogModule),
      { provide: Session, useValue: testSession },
      { provide: PartnersApi, useValue: api },
      { provide: DossierStore, useValue: store },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: new BehaviorSubject(convertToParamMap({ uuid: testParty.uuid })),
          queryParamMap: new BehaviorSubject(convertToParamMap({})),
          snapshot: { paramMap: convertToParamMap({ uuid: testParty.uuid }) },
        },
      },
      {
        provide: DIALOG_DATA,
        useValue: {
          title: 'Formulario del tercero',
          party: testParty.uuid,
          fields: partyFields,
          initial: { country: 'MX', active: true },
          mode: 'role',
          ...options.data,
        },
      },
      { provide: DialogRef, useValue: ref },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
  for (const [key, value] of Object.entries(options.inputs ?? {}))
    fixture.componentRef.setInput(key, value);
  await fixture.whenStable();
  return { fixture, api, store, ref };
}
