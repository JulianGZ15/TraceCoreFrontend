import { ModelDetailComponent } from './model-detail.component';
import { render } from '../../../../testing/component-test';
describe('ModelDetailComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(ModelDetailComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
