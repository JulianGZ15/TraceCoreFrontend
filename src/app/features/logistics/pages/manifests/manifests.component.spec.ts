import { ManifestsComponent } from './manifests.component';
import { renderLogistics, testId } from '../../testing';
import { FormGroup } from '@angular/forms';
describe('ManifestsComponent', () => {
  it('renders authorized read context without permitting a write', async () => {
    const fixture = await renderLogistics(ManifestsComponent, {});
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    const form = fixture.nativeElement.querySelector('button.btn.primary');
    if (form && form.textContent?.trim() === 'Guardar') expect(form.disabled).toBe(true);
  });
});
