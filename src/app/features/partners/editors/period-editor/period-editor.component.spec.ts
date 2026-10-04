import { PeriodEditorComponent } from './period-editor.component';
import { renderPartner } from '../../testing';
describe('PeriodEditorComponent', () => {
  it('sends credit as decimal text without rounding', async () => {
    const { fixture, api } = await renderPartner(PeriodEditorComponent, {
      data: { mode: 'terms' },
    });
    fixture.componentInstance.form.patchValue({
      currency: 'USD',
      paymentMethod: 'WIRE',
      paymentCondition: 'NET_30',
      creditDays: '30',
      creditLimit: '999999999999999.9999',
    });
    await fixture.componentInstance.save();
    expect(api.create).toHaveBeenCalledWith(
      expect.any(String),
      'commercial-terms',
      expect.objectContaining({ creditLimit: '999999999999999.9999', creditDays: 30 }),
    );
  });
  it('rejects an end that equals the inclusive start', async () => {
    const { fixture } = await renderPartner(PeriodEditorComponent);
    fixture.componentInstance.form.patchValue({
      validFrom: '2030-01-01T00:00',
      validTo: '2030-01-01T00:00',
    });
    await expect(fixture.componentInstance.save()).rejects.toThrow('posterior');
  });
});
