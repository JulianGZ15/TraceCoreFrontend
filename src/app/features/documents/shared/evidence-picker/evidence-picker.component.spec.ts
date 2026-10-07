import { describe, it, expect, vi } from 'vitest';
import { EvidencePickerComponent } from './evidence-picker.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/shared/evidence-picker/evidence-picker', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(EvidencePickerComponent, {
      inputs: { document: ids.document },
    });
    expect(api.get).not.toHaveBeenCalled();
  });
});

describe('Selección de procedencia', () => {
  it('limpia selección y descarta respuestas anteriores cuando cambia el origen', async () => {
    const { fixture, api } = await renderWorkspace(EvidencePickerComponent, {
      inputs: { document: ids.document },
    });
    const picker = fixture.componentInstance;
    let resolve!: (value: unknown) => void;
    api.get.mockImplementationOnce(() => new Promise<any>((done) => (resolve = done)));
    const emitted = vi.spyOn(picker.selected, 'emit');
    const pending = picker.load();
    picker.form.controls.sourceKind.setValue('PARTY');
    picker.sourceChanged();
    resolve({ items: [{ uuid: ids.file, filename: 'anterior.pdf' }], hasMore: false });
    await pending;
    expect(picker.rows()).toEqual([]);
    expect(picker.chosen()).toBeNull();
    expect(emitted).toHaveBeenLastCalledWith(null);
    expect(picker.busy()).toBe(false);
  });
});
