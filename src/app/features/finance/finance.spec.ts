import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { FinancePending } from './pending';
import { FinanceApi } from './finance-api';
import { FinanceAccess } from './access';
import { Session, safeReturn } from '../../core/auth/session';
import { money, numberText } from './rules';
import { InvoiceNewComponent } from './pages/invoice-new/invoice-new.component';
import { AccountComponent } from './pages/account/account.component';
import { renderFinance, fid } from './testing';
import { Subject } from 'rxjs';
describe('Finanzas: precisión, permisos y recuperación', () => {
  it('descarta una evaluación de crédito que llega después de terminar la sesión', async () => {
    const { fixture, api, session } = await renderFinance(AccountComponent);
    let resolve: () => void = () => {};
    const gate = new Promise<void>((r) => {
      resolve = r;
    });
    const originalGet = api.get;
    api.get = async (path: string) => {
      await gate;
      return originalGet(path);
    };
    const waiting = fixture.componentInstance.evaluate('activation');
    session.epoch.update((value) => value + 1);
    session.ended.next();
    resolve();
    await waiting;
    expect(fixture.componentInstance.check()).toBeNull();
    expect(fixture.componentInstance.current()).toBeNull();
  });
  it('conserva ocho decimales máximos y rechaza valores incompatibles', () => {
    expect(money('99999999999999.99999999', 8, true)).toBe('99999999999999.99999999');
    expect(() => money('1.001', 2, true)).toThrow();
    expect(() => money('-1', 2)).toThrow();
    expect(() => money('0', 2, true)).toThrow();
    expect(numberText(undefined)).toContain('incompatible');
  });
  it('acepta únicamente destinos internos financieros conocidos', () => {
    expect(safeReturn('/finanzas/terceros/' + fid + '/credito?currency=MXN')).toContain(
      '/finanzas/terceros/',
    );
    expect(safeReturn('/finanzas/desconocido')).toBe('/inicio');
    expect(safeReturn('//host/finanzas')).toBe('/inicio');
  });
  it('no hereda permisos de patio ni implica lectura desde escritura', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Session,
          useValue: {
            can: (p: string) => p === 'FINANCE_CREDIT',
            context: () => ({ yards: [{ permissions: ['FINANCE_READ'] }] }),
          },
        },
      ],
    });
    const access = TestBed.inject(FinanceAccess);
    expect(access.read()).toBe(false);
    expect(access.can('FINANCE_CREDIT')).toBe(true);
  });
  it('conserva un JSON incierto y permite recuperación tipada, sin repetir automáticamente', async () => {
    sessionStorage.removeItem('tracecore.finance.pending');
    const ended = new Subject<void>();
    const api = {
      session: { user: () => ({ uuid: fid }), valid: () => true, ended },
      post: vi.fn().mockRejectedValue(new HttpErrorResponse({ status: 0 })),
      get: vi.fn().mockResolvedValue({ invoice: { uuid: fid } }),
    };
    TestBed.configureTestingModule({ providers: [{ provide: FinanceApi, useValue: api }] });
    const pending = TestBed.inject(FinancePending);
    await expect(
      pending.create('INVOICE', '/invoices', {
        uuid: fid,
        parts: [{ netAmount: '99999999999999.99999999' }],
      }),
    ).rejects.toBeTruthy();
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(pending.own()).toHaveLength(1);
    expect(pending.own()[0].payload['parts']).toEqual([{ netAmount: '99999999999999.99999999' }]);
    await pending.recover(pending.own()[0]);
    expect(api.get).toHaveBeenCalledWith('/requests/' + fid, { operation: 'INVOICE' });
    expect(pending.own()).toHaveLength(0);
    ended.next();
    expect(sessionStorage.getItem('tracecore.finance.pending')).toBeNull();
  });
  it('ignora una vista previa atrasada y exige otra al modificar el borrador', async () => {
    const { fixture, api } = await renderFinance(InvoiceNewComponent, {}, [
      'FINANCE_READ',
      'FINANCE_MANAGE',
    ]);
    const c = fixture.componentInstance;
    c.form.patchValue({
      partyUuid: fid,
      series: 'ADM',
      folio: 'F1',
      direction: 'RECEIVABLE',
      currency: 'MXN',
      issuedAt: '2026-01-01T00:00:00Z',
      dueAt: '2026-12-01T00:00:00Z',
      reference: 'Revisión',
    });
    c.append(fid, '10.00');
    let resolve: (value: unknown) => void = () => {};
    api.post = () =>
      new Promise((r) => {
        resolve = r;
      });
    const waiting = c.preview();
    c.form.get('folio')?.setValue('F2');
    resolve({
      parts: [],
      netAmountExact: '10.00',
      taxAmountExact: '1.60',
      totalAmountExact: '11.60',
      currency: 'MXN',
      fractionDigits: 2,
      calculationFingerprint: 'f',
    });
    await waiting;
    expect(c.calculation()).toBeNull();
    expect(c.form.get('folio')?.value).toBe('F2');
    expect(c.dirty()).toBe(true);
  });
});
