import { TestBed } from '@angular/core/testing';
import { Type, importProvidersFrom, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DialogModule, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Session } from '../core/auth/session';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
export async function renderOperation<T>(type: Type<T>, inputs: Record<string, unknown> = {}) {
  const id = '00000000-0000-0000-0000-000000000001';
  const session = {
    epoch: signal(0),
    ended: new Subject<void>(),
    user: signal({ uuid: id, name: 'Operador de prueba' }),
    context: signal({
      company: { uuid: id, name: 'Pruebas', timezone: 'UTC', active: true },
      companyPermissions: [],
      yards: [],
    }),
    selectedYard: signal(''),
    can: () => false,
    valid: () => false,
    refresh: async () => {},
  };
  await TestBed.configureTestingModule({
    imports: [type],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      importProvidersFrom(DialogModule),
      { provide: Session, useValue: session },
      { provide: DialogRef, useValue: { close: () => {} } },
      {
        provide: DIALOG_DATA,
        useValue: {
          yard: '',
          row: {
            uuid: id,
            version: 0,
            quantityExact: '1',
            unitPriceExact: '1.0000',
            discountFractionExact: '0',
            taxFractionExact: '0',
            amountExact: '1.0000',
            minimumUnitsExact: '0',
          },
          action: 'approve-order',
          summary: {
            order: {
              uuid: id,
              version: 0,
              type: 'OV',
              state: 'DRAFT',
              yardUuid: id,
              currency: 'MXN',
            },
            rental: null,
          },
          rental: { uuid: id, version: 0 },
          token: '',
        },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(type);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  await fixture.whenStable();
  return fixture;
}
