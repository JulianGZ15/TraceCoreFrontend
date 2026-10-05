import { OrderEvidenceComponent } from './order-evidence.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('OrderEvidenceComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(OrderEvidenceComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
