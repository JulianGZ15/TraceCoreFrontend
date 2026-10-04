import { AvlComponent } from './avl.component';
import { renderPartner, testParty } from '../../testing';
describe('AvlComponent', () => {
  it('loads only its section and hides mutations for a reader', async () => {
    const { fixture, api } = await renderPartner(AvlComponent, { permissions: ['PARTY_READ'] });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'avl-evaluations', 0, 25, {});
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
