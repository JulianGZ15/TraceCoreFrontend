import { PartyHeaderComponent } from './party-header.component';
import { renderPartner, testParty } from '../../testing';
describe('PartyHeaderComponent', () => {
  it('shows party activity independently of role state', async () => {
    const { fixture } = await renderPartner(PartyHeaderComponent, {
      inputs: {
        party: { ...testParty, active: false },
        roles: [
          {
            uuid: 'role',
            role: 'CUSTOMER',
            validFrom: '2020-01-01T00:00:00Z',
            validTo: null,
            revokedAt: '2020-01-02T00:00:00Z',
          },
        ],
      },
    });
    expect(fixture.nativeElement.textContent).toContain('Inactivo');
    expect(fixture.nativeElement.textContent).toContain('Cliente · Revocada');
  });
});
