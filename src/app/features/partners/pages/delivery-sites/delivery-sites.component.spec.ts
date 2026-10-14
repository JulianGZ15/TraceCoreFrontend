import { DeliverySitesComponent } from './delivery-sites.component';
import { renderPartner, testParty } from '../../testing';

describe('DeliverySitesComponent', () => {
  it('loads the party-scoped delivery site projection and keeps editing permission-bound', async () => {
    const { fixture, api } = await renderPartner(DeliverySitesComponent, { permissions: ['PARTY_READ'] });
    expect(api.deliverySites).toHaveBeenCalledWith(testParty.uuid, 0, 25);
    expect(fixture.nativeElement.textContent).toContain('Sitios de entrega');
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
  });
});
