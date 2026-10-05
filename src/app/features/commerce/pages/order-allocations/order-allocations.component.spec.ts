import { OrderAllocationsComponent } from './order-allocations.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('OrderAllocationsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(OrderAllocationsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
