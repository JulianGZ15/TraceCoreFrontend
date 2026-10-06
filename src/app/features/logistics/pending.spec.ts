import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { LogisticsPending } from './pending';
import { LogisticsApi } from './logistics-api';
import { LogisticsAccess } from './access';
import { renderLogistics, testId } from './testing';
import { LookupComponent } from './shared/lookup/lookup.component';
import { safeReturn, Session } from '../../core/auth/session';
describe('Logistics recovery and scopes', () => {
  it('retains an indeterminate request and recovers without another write', async () => {
    await renderLogistics(LookupComponent);
    const api = TestBed.inject(LogisticsApi);
    const post = vi.spyOn(api, 'post').mockRejectedValue(new HttpErrorResponse({ status: 0 }));
    const p = TestBed.inject(LogisticsPending),
      payload = { requestKey: crypto.randomUUID(), folio: 'F', loads: [{ movementUuid: testId }] };
    await expect(p.create('MANIFEST', '/manifests', payload)).rejects.toBeTruthy();
    expect(p.own()).toHaveLength(1);
    expect(JSON.parse(sessionStorage.getItem('tracecore.logistics.pending')!)[0].payload).toEqual(
      payload,
    );
    vi.spyOn(api, 'get').mockResolvedValue({ uuid: testId });
    await p.recover(p.own()[0]);
    expect(post).toHaveBeenCalledTimes(1);
    expect(p.own()).toHaveLength(0);
  });
  it('cleans JSON pending requests at session end', async () => {
    await renderLogistics(LookupComponent);
    const p = TestBed.inject(LogisticsPending);
    vi.spyOn(TestBed.inject(LogisticsApi), 'post').mockRejectedValue(
      new HttpErrorResponse({ status: 503 }),
    );
    await expect(
      p.create('MANIFEST', '/manifests', { requestKey: crypto.randomUUID() }),
    ).rejects.toBeTruthy();
    TestBed.inject(Session).ended.next();
    expect(p.own()).toHaveLength(0);
    expect(sessionStorage.getItem('tracecore.logistics.pending')).toBeNull();
  });
  it('company logistics capability applies locally without granting another module', async () => {
    await renderLogistics(LookupComponent);
    const session = TestBed.inject(Session);
    vi.spyOn(session, 'can').mockImplementation((p, yard) => p === 'LOGISTICS_MANAGE' && !yard);
    const access = TestBed.inject(LogisticsAccess);
    expect(access.can('LOGISTICS_MANAGE', testId)).toBe(true);
    expect(session.can('LOGISTICS_MANAGE', testId)).toBe(false);
    expect(access.can('MOVEMENT_MANAGE', testId)).toBe(false);
  });
  it('accepts only defined internal logistics return routes', () => {
    expect(safeReturn('/logistica/manifiestos/' + testId + '/recepcion?offset=25')).toContain(
      '/logistica/',
    );
    expect(safeReturn('/logistica/desconocida')).toBe('/inicio');
    expect(safeReturn('//other/logistica')).toBe('/inicio');
  });
});
