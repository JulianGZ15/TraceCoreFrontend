import { DirectoryComponent } from './directory.component';
import { renderPartner, testParty } from '../../testing';
import { HttpErrorResponse } from '@angular/common/http';
describe('DirectoryComponent', () => {
  it('keeps loaded rows while refreshing and clears them when filters change', async () => {
    const { fixture, api } = await renderPartner(DirectoryComponent);
    const page = fixture.componentInstance;
    const rows = page.rows();
    let release!: (value: (typeof testParty)[]) => void;
    api.directory.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const refresh = page.load();
    expect(page.busy()).toBe(true);
    expect(page.rows()).toBe(rows);
    release([testParty]);
    await refresh;
    page.form.controls.search.setValue('Nueva consulta');
    const search = page.load();
    expect(page.rows()).toEqual([]);
    release([]);
    await search;
  });
  it.each([0, 401, 403])('refresh error %s retains only authorized rows', async (status) => {
    const { fixture, api } = await renderPartner(DirectoryComponent);
    const page = fixture.componentInstance;
    const rows = page.rows();
    api.directory.mockRejectedValue(new HttpErrorResponse({ status }));
    await page.load();
    expect(page.rows()).toEqual(status === 0 ? rows : []);
    expect(page.error()).toBeTruthy();
  });
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
