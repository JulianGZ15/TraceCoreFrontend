import { ProgressBar } from './progress-bar.component';
import { render } from '../../../testing/component-test';
describe('ProgressBar', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(ProgressBar, { active: true });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
