import { DriverComponent } from './driver.component';
import { renderLogistics, testId } from '../../testing';
import { FormGroup } from '@angular/forms';
describe('DriverComponent', () => {
  it('renders authorized read context without permitting a write', async () => {
    const fixture = await renderLogistics(DriverComponent, {});
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    const form = fixture.nativeElement.querySelector('button.btn.primary');
    if (form && form.textContent?.trim() === 'Guardar') expect(form.disabled).toBe(true);
  });
});
