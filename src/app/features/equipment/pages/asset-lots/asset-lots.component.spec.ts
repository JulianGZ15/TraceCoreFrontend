import { AssetLotsComponent } from './asset-lots.component';
import { render } from '../../../../testing/component-test';
describe('AssetLotsComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(AssetLotsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
