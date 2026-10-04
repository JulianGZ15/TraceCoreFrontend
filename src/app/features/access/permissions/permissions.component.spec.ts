import { PermissionsPanel } from './permissions.component';
import { render } from '../../../testing/component-test';
describe('PermissionsPanel', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(PermissionsPanel, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
