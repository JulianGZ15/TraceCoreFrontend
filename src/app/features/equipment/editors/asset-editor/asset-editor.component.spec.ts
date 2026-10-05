import { AssetEditorComponent } from './asset-editor.component';
import { render } from '../../../../testing/component-test';
describe('AssetEditorComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(AssetEditorComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
