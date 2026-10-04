import { AuthorizationsComponent } from './authorizations.component';
import { renderPartner, testParty } from '../../testing';
describe('AuthorizationsComponent', () => {
  it('loads only its section and hides mutations for a reader', async () => {
    const { fixture, api } = await renderPartner(AuthorizationsComponent, {
      permissions: ['PARTY_READ'],
    });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'operation-authorizations', 0, 25, {});
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
