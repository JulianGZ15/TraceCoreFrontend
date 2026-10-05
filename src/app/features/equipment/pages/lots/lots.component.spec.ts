import { LotsComponent } from './lots.component';
import { render } from '../../../../testing/component-test';
describe('LotsComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(LotsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
