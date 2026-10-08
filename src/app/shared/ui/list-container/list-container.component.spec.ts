import { ListContainer } from './list-container.component';
import { render } from '../../../testing/component-test';

describe('ListContainer', () => {
  it('keeps a layout slot without adding a second scroll or focus region', async () => {
    const fixture = await render(ListContainer, { tableLabel: 'Equipos RFID' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.list-table-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.table-scroll-wrap')).toBeNull();
    expect(fixture.nativeElement.querySelector('[tabindex]')).toBeNull();
  });
});
