import { HomePage } from './home.component';
import { render } from '../../../testing/component-test';
describe('HomePage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(HomePage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
