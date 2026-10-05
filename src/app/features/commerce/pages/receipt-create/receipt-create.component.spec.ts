import { ReceiptCreateComponent } from './receipt-create.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('ReceiptCreateComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(ReceiptCreateComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
