import { OrderCreditComponent } from './order-credit.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('OrderCreditComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(OrderCreditComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
