import { TaxComponent } from './tax.component';
import { renderPartner, testParty } from '../../testing';
describe('TaxComponent', () => {
  it('loads only its section and hides mutations for a reader', async () => {
    const { fixture, api } = await renderPartner(TaxComponent, { permissions: ['PARTY_READ'] });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'tax-identities', 0, 25, {});
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
