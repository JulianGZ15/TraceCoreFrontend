import { QuotaEditorComponent } from './quota-editor.component';
import { renderPartner } from '../../testing';
describe('QuotaEditorComponent', () => {
  it('sends either a region or a yard and a finite UTC period', async () => {
    const { fixture, api } = await renderPartner(QuotaEditorComponent);
    fixture.componentInstance.form.patchValue({
      location: 'REGION',
      regionCode: 'north',
      yardUuid: 'old-selection',
      productScope: 'TUBULAR_API5CT',
      quantity: '2',
      validFrom: '2030-01-01T00:00',
      validTo: '2030-02-01T00:00',
      conditions: 'Condiciones contractuales',
    });
    await fixture.componentInstance.save();
    expect(api.create).toHaveBeenCalledWith(
      expect.any(String),
      'distribution-quotas',
      expect.objectContaining({
        yardUuid: null,
        regionCode: 'NORTH',
        quantity: 2,
        validTo: '2030-02-01T00:00:00.000Z',
      }),
    );
  });
});
