import { MessagePage } from './message.component';
import { render } from '../../../testing/component-test';
describe('MessagePage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(MessagePage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
