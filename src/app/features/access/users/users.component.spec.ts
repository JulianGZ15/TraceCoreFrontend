import { UsersPage } from './users.component';
import { render } from '../../../testing/component-test';
describe('UsersPage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(UsersPage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
