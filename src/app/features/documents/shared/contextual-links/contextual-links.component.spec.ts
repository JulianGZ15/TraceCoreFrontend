import { describe, it, expect } from 'vitest';
import { ContextualLinksComponent } from './contextual-links.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/shared/contextual-links/contextual-links', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(ContextualLinksComponent, {
      inputs: { kind: 'PARTY', uuid: ids.owner },
    });
    expect(api.get).not.toHaveBeenCalled();
    await fixture.componentInstance.load();
    expect(api.get).toHaveBeenCalledWith(
      '/documents/links/directory',
      expect.objectContaining({ subjectKind: 'PARTY', subjectUuid: ids.owner }),
      expect.anything(),
    );
  });
});
