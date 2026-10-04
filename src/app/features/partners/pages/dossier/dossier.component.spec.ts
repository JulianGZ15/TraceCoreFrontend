import { DossierComponent } from './dossier.component';
import { renderPartner, testParty } from '../../testing';
describe('DossierComponent', () => {
  it('loads identity and roles without eagerly fetching every section', async () => {
    const { fixture, api } = await renderPartner(DossierComponent);
    expect(api.party).toHaveBeenCalledWith(testParty.uuid);
    expect(api.list).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(testParty.legalName);
  });
});
