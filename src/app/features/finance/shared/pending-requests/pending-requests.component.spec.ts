import { PendingRequestsComponent } from './pending-requests.component';
import { renderFinance } from '../../testing';
describe('Solicitudes pendientes', () => {
  it('no presenta solicitudes inexistentes al consultar', async () => {
    const { fixture } = await renderFinance(PendingRequestsComponent);
    expect(fixture.nativeElement.querySelector('section')).toBeNull();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
