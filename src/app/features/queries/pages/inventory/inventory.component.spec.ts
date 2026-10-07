import { describe, it, expect } from 'vitest';
import { InventoryComponent } from './inventory.component';
import { renderWorkspace, ids, testSummary } from '../../../documents/testing';
describe('queries/pages/inventory/inventory', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(InventoryComponent);
    expect(api.get).toHaveBeenCalledWith(
      '/queries/inventory',
      expect.objectContaining({ offset: 0, limit: 25 }),
      expect.anything(),
    );
    fixture.componentInstance.form.controls.assetUuid.setValue('bad');
    fixture.componentInstance.apply();
    expect(fixture.componentInstance.error()).toContain('UUID');
  });
});
