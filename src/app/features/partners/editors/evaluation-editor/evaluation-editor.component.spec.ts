import { EvaluationEditorComponent } from './evaluation-editor.component';
import { renderPartner } from '../../testing';
describe('EvaluationEditorComponent', () => {
  it('keeps manual decision independent of score and omits actor fields', async () => {
    const { fixture, api } = await renderPartner(EvaluationEditorComponent);
    fixture.componentInstance.form.patchValue({
      scope: 'api_6a',
      score: '100',
      classification: 'TIER_1',
      decision: 'REJECTED',
      findings: 'Revisión manual',
      nextReviewAt: '2030-01-01T00:00',
    });
    await fixture.componentInstance.save();
    const body = api.create.mock.calls[0][2] as Record<string, unknown>;
    expect(body['decision']).toBe('REJECTED');
    expect(body['score']).toBe('100');
    expect(body['evaluatorUuid']).toBeUndefined();
  });
});
