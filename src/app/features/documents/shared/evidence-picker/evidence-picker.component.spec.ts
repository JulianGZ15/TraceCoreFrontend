import { describe, it, expect } from 'vitest';
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
  it('no muestra UUID editable ni paginación y limpia la evidencia elegida', async () => {
    const { fixture, api } = await renderWorkspace(EvidencePickerComponent, {
      inputs: { document: ids.document },
    });
    const picker = fixture.componentInstance;
    picker.choose({ value: ids.file, label: 'evidencia.pdf' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(ids.file);
    expect(fixture.nativeElement.querySelector('tc-pagination')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[formControlName="contextUuid"]')).toBeNull();
    picker.choose(null);
    expect(picker.chosen()).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });
});
