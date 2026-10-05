import { HistoryEditorComponent } from './history-editor.component';
import { render } from '../../../../testing/component-test';
describe('HistoryEditorComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(HistoryEditorComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
