import { describe, it, expect } from 'vitest';
import { DecisionEditorComponent } from './decision-editor.component';
import { renderWorkspace, ids, testSummary } from '../../testing';
describe('documents/editors/decision-editor/decision-editor', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(DecisionEditorComponent, {
      data: {
        title: 'Aprobar versión',
        path: '/documents/versions/' + ids.file + '/decisions',
        readPath: '/documents/versions/' + ids.file,
        version: 0,
        action: 'APPROVE',
      },
    });
    await fixture.componentInstance.save();
    expect(api.post).not.toHaveBeenCalled();
  });
});
