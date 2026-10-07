import { describe, it, expect } from 'vitest';
import { OrdersComponent } from './orders.component';
import { renderWorkspace, ids, testSummary } from '../../../documents/testing';
describe('queries/pages/orders/orders', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(OrdersComponent);
    expect(api.get).toHaveBeenCalledWith(
      '/queries/orders',
      expect.objectContaining({ offset: 0, limit: 25 }),
      expect.anything(),
    );
    fixture.componentInstance.form.controls.from.setValue('2026-10-06T00:00:00');
    fixture.componentInstance.apply();
    expect(fixture.componentInstance.error()).toContain('desplazamiento');
  });
});
