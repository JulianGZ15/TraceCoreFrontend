import { AssetGeneralComponent } from './asset-general.component';
import { render } from '../../../../testing/component-test';
describe('AssetGeneralComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(AssetGeneralComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
