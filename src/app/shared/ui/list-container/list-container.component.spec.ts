import { ListContainer } from './list-container.component';
import { render } from '../../../testing/component-test';

describe('ListContainer', () => {
  it('renders structure with accessible table wrapper', async () => {
    const fixture = await render(ListContainer, { tableLabel: 'Equipos RFID' });
    fixture.detectChanges();

    const scrollWrap = fixture.nativeElement.querySelector('.table-scroll-wrap');
    expect(scrollWrap).toBeTruthy();
    expect(scrollWrap.getAttribute('aria-label')).toBe('Equipos RFID');
    expect(scrollWrap.getAttribute('tabindex')).toBe('0');
  });
});
