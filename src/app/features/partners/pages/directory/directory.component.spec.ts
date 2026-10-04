import { DirectoryComponent } from './directory.component';
import { renderPartner } from '../../testing';
describe('DirectoryComponent', () => {
  it('lists identities without fetching each dossier and respects read-only access', async () => {
    const { fixture, api } = await renderPartner(DirectoryComponent, {
      permissions: ['PARTY_READ'],
    });
    expect(api.directory).toHaveBeenCalledWith({ offset: 0, limit: 25 });
    expect(api.list).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Empresa de prueba');
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
  });
});
