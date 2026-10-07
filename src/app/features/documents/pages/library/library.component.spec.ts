import { describe, it, expect } from 'vitest';
import { LibraryComponent } from './library.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/pages/library/library', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(LibraryComponent);
    expect(api.get).toHaveBeenCalledWith(
      '/documents/directory',
      expect.objectContaining({ offset: 0, limit: 25 }),
      expect.anything(),
    );
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Biblioteca');
  });
});
