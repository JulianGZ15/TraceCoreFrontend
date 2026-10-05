import { CatalogEditorComponent } from './catalog-editor.component';
import { render } from '../../../../testing/component-test';
describe('CatalogEditorComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(CatalogEditorComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
