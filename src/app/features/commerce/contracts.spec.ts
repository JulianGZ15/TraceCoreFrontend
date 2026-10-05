import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CommerceApi } from './commerce-api';
import { CommercePending } from './pending';
import { CommerceAccess } from './access';
import { Session, safeReturn } from '../../core/auth/session';
import { fraction, instant, form } from './rules';
describe('commercial interaction contracts', () => {
  it('retains exact maximums and requires explicit instant offsets', () => {
    const f = form(
      [{ key: 'price', label: 'Importe', type: 'decimal', scale: 4, required: true }],
      { price: '99999999999999.9999' },
    );
    expect(f.valid).toBe(true);
    expect(f.getRawValue()['price']).toBe('99999999999999.9999');
    f.controls['price'].setValue('999999999999999.0000');
    expect(f.invalid).toBe(true);
    expect(() => fraction('1.00000001')).toThrow();
    expect(instant('2026-10-01T12:00:00-06:00')).toBe('2026-10-01T12:00:00-06:00');
    expect(() => instant('2026-10-01T12:00:00')).toThrow();
  });
  it('company and yard scope are local; writing never grants reading', () => {
    const session = {
      can: (c: string, y?: string) => (y === 'yard' ? c === 'COMMERCIAL_MANAGE' : false),
      context: () => ({
        yards: [{ uuid: 'yard', active: true, permissions: ['COMMERCIAL_MANAGE'] }],
      }),
    };
    TestBed.configureTestingModule({ providers: [{ provide: Session, useValue: session }] });
    const access = TestBed.inject(CommerceAccess);
    expect(access.can('COMMERCIAL_MANAGE', 'yard')).toBe(true);
    expect(access.any('COMMERCIAL_READ')).toBe(false);
    expect(access.can('COMMERCIAL_MANAGE', 'other')).toBe(false);
    expect(safeReturn('/comercial/ordenes')).toBe('/comercial/ordenes');
    expect(safeReturn('//evil.test')).toBe('/inicio');
  });
  it('persists uncertain JSON, prevents automatic repeats and clears at session end', async () => {
    sessionStorage.clear();
    const ended = new Subject<void>();
    let calls = 0;
    const api = {
      session: { ended, user: signal({ uuid: 'actor' }), valid: () => true },
      post: async () => {
        calls++;
        throw new HttpErrorResponse({ status: 0 });
      },
      get: async () => ({ uuid: 'confirmed' }),
    };
    TestBed.configureTestingModule({ providers: [{ provide: CommerceApi, useValue: api }] });
    const pending = TestBed.inject(CommercePending);
    const key = crypto.randomUUID();
    await expect(pending.create('ORDER', '/orders', { uuid: key, folio: 'A' })).rejects.toThrow();
    expect(calls).toBe(1);
    expect(pending.own()).toHaveLength(1);
    await expect(
      pending.create('ORDER', '/orders', { uuid: key, folio: 'Changed' }),
    ).rejects.toThrow('pendiente');
    expect(calls).toBe(1);
    expect(JSON.parse(sessionStorage.getItem('tracecore.commerce.pending')!)[0].payload.folio).toBe(
      'A',
    );
    await pending.recover(pending.own()[0]);
    expect(calls).toBe(1);
    expect(pending.own()).toHaveLength(0);
    ended.next();
    expect(sessionStorage.getItem('tracecore.commerce.pending')).toBe(null);
  });
});
