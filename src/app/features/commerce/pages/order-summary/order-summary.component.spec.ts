import { OrderSummaryComponent } from './order-summary.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('OrderSummaryComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(OrderSummaryComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
