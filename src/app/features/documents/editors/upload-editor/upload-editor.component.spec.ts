import { describe, it, expect } from 'vitest';
import { UploadEditorComponent } from './upload-editor.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/editors/upload-editor/upload-editor', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(UploadEditorComponent);
    await fixture.componentInstance.save();
    expect(api.post).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('archivo');
  });
});
