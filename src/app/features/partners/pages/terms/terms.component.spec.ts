import { TermsComponent } from './terms.component';
import { renderPartner, testParty } from '../../testing';
describe('TermsComponent', () => {
  it('loads only its section and hides mutations for a reader', async () => {
    const { fixture, api } = await renderPartner(TermsComponent, { permissions: ['PARTY_READ'] });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'commercial-terms', 0, 25, {});
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
