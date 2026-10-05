import { AssetsComponent } from './assets.component';
import { render } from '../../../../testing/component-test';
describe('AssetsComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(AssetsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
