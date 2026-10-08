import { Skeleton } from './skeleton.component';
import { render } from '../../../testing/component-test';
describe('Skeleton', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(Skeleton, { variant: 'table', rows: 3 });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
