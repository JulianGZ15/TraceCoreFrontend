import { EvidencePickerComponent } from './evidence-picker.component';
import { renderPartner, testParty } from '../../testing';
describe('EvidencePickerComponent', () => {
  it('keeps the selected value internally without exposing it or pagination', async () => {
    const uuid = 'other-page';
    const { fixture, api } = await renderPartner(EvidencePickerComponent, {
      inputs: { party: testParty.uuid, value: uuid },
    });
    expect(api.list).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain(uuid);
    expect(fixture.nativeElement.querySelector('tc-pagination')).toBeNull();
    expect(fixture.componentInstance.value()).toBe(uuid);
  });
});
