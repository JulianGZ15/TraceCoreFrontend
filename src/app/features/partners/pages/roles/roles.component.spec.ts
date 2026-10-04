import { RolesComponent } from './roles.component';
import { renderPartner, testParty } from '../../testing';
describe('RolesComponent', () => {
  it('loads only its section and hides mutations for a reader', async () => {
    const { fixture, api } = await renderPartner(RolesComponent, { permissions: ['PARTY_READ'] });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'roles', 0, 25, {});
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
