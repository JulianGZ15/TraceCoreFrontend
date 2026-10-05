import { HeatsComponent } from './heats.component';
import { render } from '../../../../testing/component-test';
describe('HeatsComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(HeatsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
