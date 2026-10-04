import { EvidencePickerComponent } from './evidence-picker.component';
import { renderPartner, testParty } from '../../testing';
describe('EvidencePickerComponent', () => {
  it('keeps a selected UUID that is outside the visible evidence page', async () => {
    const { fixture, api } = await renderPartner(EvidencePickerComponent, {
      inputs: { party: testParty.uuid, value: 'other-page' },
    });
    expect(api.list).toHaveBeenCalledWith(testParty.uuid, 'evidence', 0, 25);
    expect(fixture.nativeElement.textContent).toContain('other-page');
    expect(fixture.componentInstance.value()).toBe('other-page');
  });
});
