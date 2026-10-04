import { SectionNavigationComponent } from './section-navigation.component';
import { renderPartner, testParty } from '../../testing';
describe('SectionNavigationComponent', () => {
  it('offers eleven linkable sections for the selected UUID', async () => {
    const { fixture } = await renderPartner(SectionNavigationComponent, {
      inputs: { uuid: testParty.uuid },
    });
    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBe(11);
    expect(links[10].getAttribute('href')).toContain(testParty.uuid + '/cuotas');
  });
});
