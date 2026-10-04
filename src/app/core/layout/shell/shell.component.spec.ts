import { Shell } from './shell.component';
import { render } from '../../../testing/component-test';
describe('Shell', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(Shell, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
