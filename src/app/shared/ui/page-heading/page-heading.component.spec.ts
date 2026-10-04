import { PageHeading } from './page-heading.component';
import { render } from '../../../testing/component-test';
describe('PageHeading', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(PageHeading, { title: 'Organización' });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
