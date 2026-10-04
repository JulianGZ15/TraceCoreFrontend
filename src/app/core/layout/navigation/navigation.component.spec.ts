import { Navigation } from './navigation.component';
import { render } from '../../../testing/component-test';
describe('Navigation', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(Navigation, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
