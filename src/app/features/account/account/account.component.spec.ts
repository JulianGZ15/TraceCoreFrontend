import { AccountPage } from './account.component';
import { render } from '../../../testing/component-test';
describe('AccountPage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(AccountPage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
