import { describe, it, expect } from 'vitest';
import { FilterPickerComponent } from './filter-picker.component';
import { renderWorkspace, ids, testSummary } from '../../../documents/testing';
describe('queries/shared/filter-picker/filter-picker', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(FilterPickerComponent, {
      inputs: { query: 'INVENTORY', kind: 'MODEL', label: 'Modelo' },
    });
    expect(api.get).not.toHaveBeenCalled();
    await fixture.componentInstance.load();
    expect(api.get).toHaveBeenCalledWith(
      '/queries/filter-options',
      expect.objectContaining({ kind: 'MODEL', limit: 25 }),
      expect.anything(),
    );
  });
});
