import { LookupComponent } from './lookup.component';
import { renderLogistics, testId } from '../../testing';

describe('LookupComponent', () => {
  it('preserves an existing UUID and removes paging controls from the combo', async () => {
    const f = await renderLogistics(LookupComponent, { value: testId });
    expect(f.componentInstance.selected()).toBe(testId);
    expect(f.nativeElement.textContent).toContain(testId);
    expect(f.nativeElement.textContent).not.toContain('Anterior');
    expect(f.nativeElement.textContent).not.toContain('Siguiente');
    expect(f.nativeElement.textContent).not.toContain('Filas');
  });
});
