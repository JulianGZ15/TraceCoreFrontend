import { QuotaTargetEditorComponent } from './quota-target-editor.component';
import { render } from '../../../../testing/component-test';
describe('QuotaTargetEditorComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(QuotaTargetEditorComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
