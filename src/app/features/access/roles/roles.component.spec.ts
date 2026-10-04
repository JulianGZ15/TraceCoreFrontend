import { RolesPage } from './roles.component';
import { render } from '../../../testing/component-test';
describe('RolesPage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(RolesPage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
