import { LoginPage } from './login.component';
import { render } from '../../../testing/component-test';
describe('LoginPage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(LoginPage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
