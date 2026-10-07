import { describe, it, expect } from 'vitest';
import { SubjectPickerComponent } from './subject-picker.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/shared/subject-picker/subject-picker', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(SubjectPickerComponent, {
      inputs: { kind: 'PARTY', source: 'QUERIES', yard: ids.owner },
    });
    expect(api.get).toHaveBeenCalledWith(
      '/queries/party-options',
      expect.objectContaining({ yardUuid: null }),
      expect.anything(),
    );
    fixture.componentInstance.choose({ uuid: ids.owner, kind: 'PARTY', label: 'Tercero' });
    expect(fixture.componentInstance.chosen()?.uuid).toBe(ids.owner);
  });
});
