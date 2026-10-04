import { QuotasComponent } from './quotas.component';
import { renderPartner, testParty } from '../../testing';
describe('QuotasComponent', () => {
  it('loads only its section and hides mutations for a reader', async () => {
    const { fixture, api } = await renderPartner(QuotasComponent, { permissions: ['PARTY_READ'] });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'distribution-quotas', 0, 25, {});
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
