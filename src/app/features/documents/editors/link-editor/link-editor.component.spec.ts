import { describe, it, expect } from 'vitest';
import { LinkEditorComponent } from './link-editor.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/editors/link-editor/link-editor', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(LinkEditorComponent, { data: testSummary });
    await fixture.componentInstance.save();
    expect(api.post).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });
});
