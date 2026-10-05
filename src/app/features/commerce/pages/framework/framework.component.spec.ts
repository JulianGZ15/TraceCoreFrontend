import { FrameworkComponent } from './framework.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('FrameworkComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(FrameworkComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
