import { FieldsComponent } from './fields.component';
import { renderLogistics } from '../../testing';
import { FormGroup, FormControl, Validators } from '@angular/forms';
describe('FieldsComponent', () => {
  it('preserves exact decimal text and exposes required errors', async () => {
    const form = new FormGroup({
      weight: new FormControl('999999999999.999999', { validators: Validators.required }),
    });
    const f = await renderLogistics(FieldsComponent, {
      form,
      fields: [{ key: 'weight', label: 'Peso', type: 'decimal', required: true }],
    });
    const input = f.nativeElement.querySelector('input');
    expect(input.value).toBe('999999999999.999999');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await f.whenStable();
    expect(form.invalid).toBe(true);
  });
});
