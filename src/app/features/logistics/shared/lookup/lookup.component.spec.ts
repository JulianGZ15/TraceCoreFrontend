import { TestBed } from '@angular/core/testing';
import { LookupComponent } from './lookup.component';
import { renderLogistics, testId } from '../../testing';
import { LogisticsApi } from '../../logistics-api';
describe('LookupComponent', () => {
  it('preserves and visibly selects an existing UUID outside the loaded page', async () => {
    const f = await renderLogistics(LookupComponent, { value: testId });
    const select = f.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe(testId);
    vi.spyOn(TestBed.inject(LogisticsApi), 'get').mockResolvedValue([
      { uuid: '80000000-0000-4000-8000-000000000002', label: 'Otra opción' },
    ]);
    f.componentInstance.move(25);
    await f.whenStable();
    expect(select.value).toBe(testId);
    expect(f.componentInstance.selected()).toBe(testId);
  });
});
