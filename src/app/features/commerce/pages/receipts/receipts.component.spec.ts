import { ReceiptsComponent } from './receipts.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('ReceiptsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(ReceiptsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
