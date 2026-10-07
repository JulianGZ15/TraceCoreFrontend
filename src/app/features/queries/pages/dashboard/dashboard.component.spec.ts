import { describe, it, expect } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { renderWorkspace, ids, testSummary } from '../../../documents/testing';
describe('queries/pages/dashboard/dashboard', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(DashboardComponent);
    expect(api.get.mock.calls.some((c) => c[0] === '/queries/dashboard')).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Selecciona un patio');
  });
});
