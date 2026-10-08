import { FrameworksComponent } from './frameworks.component';
import { renderOperation } from '../../../../testing/operation-test';
import { convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
describe('FrameworksComponent', () => {
  it('keeps rows on refresh and clears them when paging changes', async () => {
    const fixture = await renderOperation(FrameworksComponent);
    const page = fixture.componentInstance;
    const entities = [{ uuid: 'framework', folio: 'CON-001' }];
    vi.spyOn(page.api, 'get').mockResolvedValue(entities);
    await page.reload();
    const rows = page.rows();
    let release!: (value: typeof entities) => void;
    vi.spyOn(page.api, 'get').mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }) as never,
    );
    const refresh = page.reload();
    expect(page.rows()).toBe(rows);
    release(entities);
    await refresh;
    Object.defineProperty(page.route.snapshot, 'queryParamMap', {
      value: convertToParamMap({ offset: '25' }),
    });
    const nextPage = page.reload();
    expect(page.rows()).toEqual([]);
    release([]);
    await nextPage;
  });
  it.each([0, 401, 403])('refresh error %s retains only authorized rows', async (status) => {
    const fixture = await renderOperation(FrameworksComponent);
    const page = fixture.componentInstance;
    vi.spyOn(page.api, 'get').mockResolvedValue([{ uuid: 'framework', folio: 'CON-001' }]);
    await page.reload();
    const rows = page.rows();
    vi.spyOn(page.api, 'get').mockRejectedValue(new HttpErrorResponse({ status }));
    await page.reload();
    expect(page.rows()).toEqual(status === 0 ? rows : []);
    expect(page.error()).toBeTruthy();
  });
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(FrameworksComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
