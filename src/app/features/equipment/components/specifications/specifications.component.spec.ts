import { SpecificationsComponent } from './specifications.component';
import { render } from '../../../../testing/component-test';
describe('SpecificationsComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(SpecificationsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
