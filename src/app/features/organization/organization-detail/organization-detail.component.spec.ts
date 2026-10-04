import { OrganizationDetail } from './organization-detail.component';
import { render } from '../../../testing/component-test';
describe('OrganizationDetail', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(OrganizationDetail, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
