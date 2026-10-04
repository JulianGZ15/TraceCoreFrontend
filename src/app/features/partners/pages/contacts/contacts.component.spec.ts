import { ContactsComponent } from './contacts.component';
import { renderPartner, testParty } from '../../testing';
describe('ContactsComponent', () => {
  it('ignores late responses from an older page', async () => {
    const { fixture, api } = await renderPartner(ContactsComponent);
    let first!: (value: object[]) => void, second!: (value: object[]) => void;
    api.list
      .mockImplementationOnce(() => new Promise((resolve) => (first = resolve)))
      .mockImplementationOnce(() => new Promise((resolve) => (second = resolve)));
    const old = fixture.componentInstance.load(0),
      latest = fixture.componentInstance.load(25);
    second([{ uuid: 'latest', name: 'Última página', version: 0 }]);
    await latest;
    first([{ uuid: 'older', name: 'Página atrasada', version: 0 }]);
    await old;
    expect(fixture.componentInstance.rows()[0].uuid).toBe('latest');
  });
  it('loads only its section and hides mutations for a reader', async () => {
    const { fixture, api } = await renderPartner(ContactsComponent, {
      permissions: ['PARTY_READ'],
    });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'contacts', 0, 25, {});
    expect(fixture.nativeElement.querySelector('.primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
