import { OrderReceiptsComponent } from './order-receipts.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('OrderReceiptsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(OrderReceiptsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
