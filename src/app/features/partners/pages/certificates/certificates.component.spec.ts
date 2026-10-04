import { CertificatesComponent } from './certificates.component';
import { renderPartner, testParty } from '../../testing';
describe('CertificatesComponent', () => {
  it('loads only its section and hides mutations for a reader', async () => {
    const { fixture, api } = await renderPartner(CertificatesComponent, {
      permissions: ['PARTY_READ'],
    });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'certifications', 0, 25, {});
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
