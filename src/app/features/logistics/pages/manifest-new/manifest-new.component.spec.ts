import { ManifestNewComponent } from './manifest-new.component';
import { renderLogistics, testId } from '../../testing';
import { FormGroup } from '@angular/forms';
describe('ManifestNewComponent', () => {
  it('renders authorized read context without permitting a write', async () => {
    const fixture = await renderLogistics(ManifestNewComponent, {});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelectorAll('tc-stepper li.stepper-item')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('tc-stepper button[aria-current="step"]')).toBeTruthy();
    const form = fixture.nativeElement.querySelector('button.btn.primary');
    if (form && form.textContent?.trim() === 'Guardar') expect(form.disabled).toBe(true);
  });
});
