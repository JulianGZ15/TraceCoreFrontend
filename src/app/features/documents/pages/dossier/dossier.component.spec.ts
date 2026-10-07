import { describe, it, expect } from 'vitest';
import { DossierComponent } from './dossier.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/pages/dossier/dossier', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(DossierComponent);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Documento autorizado');
  });
});
