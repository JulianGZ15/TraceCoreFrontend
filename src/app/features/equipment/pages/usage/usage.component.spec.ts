import { UsageComponent } from './usage.component';
import { render } from '../../../../testing/component-test';
describe('UsageComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(UsageComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
