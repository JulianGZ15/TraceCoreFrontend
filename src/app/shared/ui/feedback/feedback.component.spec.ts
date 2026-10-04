import { Feedback } from './feedback.component';
import { render } from '../../../testing/component-test';
describe('Feedback', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(Feedback, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
