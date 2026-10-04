import { EvidenceComponent } from './evidence.component';
import { renderPartner, testParty } from '../../testing';
describe('EvidenceComponent', () => {
  it('loads only its section and hides mutations for a reader', async () => {
    const { fixture, api } = await renderPartner(EvidenceComponent, {
      permissions: ['PARTY_READ'],
    });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'evidence', 0, 25, {});
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
