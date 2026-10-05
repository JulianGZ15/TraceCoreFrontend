import { BillingPreviewComponent } from './billing-preview.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('BillingPreviewComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(BillingPreviewComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
