import { HomePage } from './home.component';
import { render } from '../../../testing/component-test';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Api } from '../../../core/http/api';
import { HttpErrorResponse } from '@angular/common/http';
import { Session } from '../../../core/auth/session';
import { company } from '../../../testing/component-test';

describe('HomePage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(HomePage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('Indicadores no disponibles');
  });

  it('loads the selected authorized scope and refreshes when the scope changes', async () => {
    const yard = {
      uuid: 'yard-1', companyUuid: company.uuid, code: 'YARD1', name: 'Patio uno',
      timezone: 'America/Mexico_City', active: true, permissions: ['QUERY_READ'],
    };
    const dashboard = {
      generatedAt: '2026-10-27T12:00:00Z',
      scope: { type: 'COMPANY' as const, companyUuid: company.uuid, yardUuid: null },
      period: { from: '2026-10-01T06:00:00Z', to: '2026-10-27T12:00:00Z', timezone: company.timezone },
      inventory: { authorized: true, data: { identifiedPieces: 12, positions: 10, knownWeightKgExact: '25.000000', unknownWeightGroups: 1, assetsInTransit: 0, pendingProposals: 0 } },
      commercial: { authorized: false, data: null }, logistics: { authorized: false, data: null },
      quality: { authorized: false, data: null }, partners: { authorized: false, data: null },
      finance: { authorized: false, data: null }, documents: { authorized: false, data: null },
      rfid: { authorized: false, data: null }, organization: { authorized: false, data: null },
      access: { authorized: false, data: null },
    };
    const session = {
      user: signal({ name: 'Ana Administradora' }),
      context: signal({ company, companyPermissions: ['QUERY_READ'], yards: [yard] }),
      selectedYard: signal(''), ended: new Subject<void>(), can: () => false,
      inventoryRead: () => false, inventoryWrite: () => false, documentRead: () => false,
      documentWrite: () => false, queryRead: () => true, queryExport: () => false,
      supportRead: () => false, logisticsRead: () => false, logisticsWrite: () => false,
      financeRead: () => false, financeWrite: () => false, commerceRead: () => false,
      commerceWrite: () => false, rfidRead: () => false, qualityRead: () => false,
      qualityWrite: () => false,
    };
    const get = vi.fn(async (_path: string, _params?: Record<string, string | number>) => dashboard);
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([]), { provide: Session, useValue: session }, { provide: Api, useValue: { get } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(get).toHaveBeenNthCalledWith(1, '/queries/home', {});
    expect(fixture.nativeElement.textContent).toContain('Piezas identificadas');
    expect(fixture.nativeElement.textContent).toContain('12');

    await fixture.componentInstance.changeScope(yard.uuid);
    fixture.detectChanges();
    expect(get).toHaveBeenNthCalledWith(2, '/queries/home', { yardUuid: yard.uuid });

    get.mockRejectedValueOnce(new HttpErrorResponse({ status: 403 }));
    await fixture.componentInstance.loadDashboard();
    fixture.detectChanges();
    expect(fixture.componentInstance.dashboardForbidden()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Acceso denegado');

    get.mockRejectedValueOnce(new HttpErrorResponse({ status: 500 }));
    await fixture.componentInstance.loadDashboard();
    fixture.detectChanges();
    expect(fixture.componentInstance.dashboardForbidden()).toBe(false);
    expect(fixture.componentInstance.dashboardError()).toContain('servidor');
  });
});
