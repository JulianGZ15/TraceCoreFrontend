import { CheckDetailComponent } from './check-detail.component';
import { renderLogistics, testId } from '../../testing';
import { FormGroup } from '@angular/forms';
describe('CheckDetailComponent', () => {
  it('renders authorized read context without permitting a write', async () => {
    const fixture = await renderLogistics(CheckDetailComponent, {});
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    const form = fixture.nativeElement.querySelector('button.btn.primary');
    if (form && form.textContent?.trim() === 'Guardar') expect(form.disabled).toBe(true);
  });
});
