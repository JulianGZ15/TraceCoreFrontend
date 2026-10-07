import { describe, it, expect } from 'vitest';
import { VersionComponent } from './version.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/pages/version/version', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(VersionComponent);
    expect(api.get).toHaveBeenCalledWith('/documents/versions/' + ids.file, {}, expect.anything());
    expect(fixture.nativeElement.textContent).toContain('source.pdf');
  });
});
