import { describe, it, expect } from 'vitest';
import { DocumentEditorComponent } from './document-editor.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/editors/document-editor/document-editor', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(DocumentEditorComponent, {
      data: { kind: 'PARTY', uuid: ids.owner },
    });
    await fixture.componentInstance.save();
    expect(api.post).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.title.touched).toBe(true);
  });
});
