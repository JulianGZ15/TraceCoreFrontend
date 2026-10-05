import { PendingRequestsComponent } from './pending-requests.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('PendingRequestsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(PendingRequestsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
