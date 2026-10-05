import { RelationshipEditorComponent } from './relationship-editor.component';
import { render } from '../../../../testing/component-test';
describe('RelationshipEditorComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(RelationshipEditorComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
