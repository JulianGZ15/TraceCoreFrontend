import { PendingRequestsComponent } from './pending-requests.component';
import { renderLogistics } from '../../testing';
describe('PendingRequestsComponent', () => {
  it('does not display recovery controls without a pending operation', async () => {
    const f = await renderLogistics(PendingRequestsComponent);
    expect(f.nativeElement.querySelector('button')).toBeNull();
  });
});
