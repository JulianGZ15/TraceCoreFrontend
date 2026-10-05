import { ModelsComponent } from './models.component';
import { render } from '../../../../testing/component-test';
describe('ModelsComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(ModelsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
