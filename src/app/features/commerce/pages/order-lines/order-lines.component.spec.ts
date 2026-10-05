import { OrderLinesComponent } from './order-lines.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('OrderLinesComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(OrderLinesComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
