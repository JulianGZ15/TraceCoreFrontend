import { Status } from './status.component';
import { render } from '../../../testing/component-test';
describe('Status', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(Status, { active: true });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
