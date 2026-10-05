import { ConditionsComponent } from './conditions.component';
import { render } from '../../../../testing/component-test';
describe('ConditionsComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(ConditionsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
