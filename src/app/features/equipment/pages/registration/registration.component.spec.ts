import { RegistrationComponent } from './registration.component';
import { render } from '../../../../testing/component-test';
describe('RegistrationComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(RegistrationComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
