import { AssetTechnicalComponent } from './asset-technical.component';
import { render } from '../../../../testing/component-test';
describe('AssetTechnicalComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(AssetTechnicalComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
