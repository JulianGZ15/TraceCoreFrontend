import { GeneralComponent } from './general.component';
import { renderPartner } from '../../testing';
describe('GeneralComponent', () => {
  it('disables identity editing without PARTY_MANAGE', async () => {
    const { fixture } = await renderPartner(GeneralComponent, { permissions: ['PARTY_READ'] });
    expect(fixture.componentInstance.form.disabled).toBe(true);
  });
  it('sends the current version on update', async () => {
    const { fixture, api } = await renderPartner(GeneralComponent);
    fixture.componentInstance.form.controls.legalName.setValue('Empresa editada');
    await fixture.componentInstance.save();
    expect(api.updateParty).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ legalName: 'Empresa editada' }),
      2,
    );
  });
});
