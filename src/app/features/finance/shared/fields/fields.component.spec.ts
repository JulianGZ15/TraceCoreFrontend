import { FieldsComponent } from './fields.component';
import { renderFinance } from '../../testing';
import { FormGroup, FormControl } from '@angular/forms';
describe('FieldsComponent', () => {
  it('vincula una etiqueta accesible al control monetario sin convertir su texto', async () => {
    const form = new FormGroup({ amount: new FormControl('99999999999999.99999999') });
    const { fixture } = await renderFinance(FieldsComponent, {
      form,
      fields: [{ key: 'amount', label: 'Importe exacto', type: 'decimal' }],
    });
    expect(fixture.nativeElement.querySelector('label').htmlFor).toBe(
      fixture.nativeElement.querySelector('input').id,
    );
    expect(fixture.nativeElement.querySelector('input').value).toBe('99999999999999.99999999');
  });
});
