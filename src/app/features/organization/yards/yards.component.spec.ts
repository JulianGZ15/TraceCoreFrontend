import { YardsPage } from './yards.component';
import { render } from '../../../testing/component-test';
describe('YardsPage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(YardsPage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
