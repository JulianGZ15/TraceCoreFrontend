import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import { QualityPending, pendingKey } from './pending';
import { qualityTestProviders } from './testing';
describe('solicitudes persistentes de calidad', () => {
  it('conserva la misma clave y payload ante respuesta perdida y recarga', async () => {
    sessionStorage.clear();
    const s = qualityTestProviders();
    TestBed.configureTestingModule({ providers: s.providers });
    const pending = TestBed.inject(QualityPending);
    s.api.post.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }));
    const payload = { assetUuid: 'asset', facility: 'Facility' };
    await expect(pending.create('inspections', payload)).rejects.toBeTruthy();
    const r = pending.own()[0];
    payload.facility = 'Changed';
    expect(r.payload['facility']).toBe('Facility');
    expect(JSON.parse(sessionStorage.getItem(pendingKey)!)[0].key).toBe(r.key);
    await pending.repeat(r);
    expect(s.api.post.mock.calls[1][2]).toBe(r.key);
    expect(s.api.post.mock.calls[1][1]).toEqual(r.payload);
    expect(pending.own()).toHaveLength(0);
  });
  it('un 404 no retira una solicitud indeterminada y cerrar sesión la limpia', async () => {
    sessionStorage.clear();
    const s = qualityTestProviders();
    TestBed.configureTestingModule({ providers: s.providers });
    const pending = TestBed.inject(QualityPending);
    s.api.post.mockRejectedValueOnce(new HttpErrorResponse({ status: 503 }));
    await expect(pending.create('maintenance', { assetUuid: 'asset' })).rejects.toBeTruthy();
    s.api.get.mockRejectedValueOnce(new HttpErrorResponse({ status: 404 }));
    await expect(pending.receipt(pending.own()[0])).rejects.toBeTruthy();
    expect(pending.own()).toHaveLength(1);
    s.session.ended.next();
    expect(sessionStorage.getItem(pendingKey)).toBeNull();
    expect(pending.rows()).toHaveLength(0);
  });
  it('no repite solicitudes de otro actor', async () => {
    sessionStorage.clear();
    const s = qualityTestProviders();
    TestBed.configureTestingModule({ providers: s.providers });
    const pending = TestBed.inject(QualityPending);
    await expect(
      pending.repeat({
        actor: 'other',
        key: 'key',
        resource: 'releases',
        payload: {},
        createdAt: '',
      }),
    ).rejects.toThrow(/otra sesión/);
    expect(s.api.post).not.toHaveBeenCalled();
  });
});
