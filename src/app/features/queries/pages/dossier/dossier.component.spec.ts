import { describe, it, expect } from 'vitest';
import { DossierComponent } from './dossier.component';
import { renderWorkspace, ids, testSummary } from '../../../documents/testing';
describe('queries/pages/dossier/dossier', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(DossierComponent);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get.mock.calls.some((c) => c[0].includes('/sections/'))).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('instantánea');
  });
});
