import { Icon } from './icon.component';
import { render } from '../../../testing/component-test';
describe('Icon', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(Icon, { name: 'home' });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
