import { MaterialsComponent } from './materials.component';
import { render } from '../../../../testing/component-test';
describe('MaterialsComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(MaterialsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
