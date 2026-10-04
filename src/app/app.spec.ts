import { App } from './app';
import { render } from './testing/component-test';
describe('App', () => {
  it('hosts the router outlet', async () => {
    const fixture = await render(App);
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
