import { Pagination } from './pagination.component';
import { render } from '../../../testing/component-test';
describe('Pagination', () => {
  it('has no previous page at offset zero or next page after a short result', async () => {
    const fixture = await render(Pagination, { count: 2 });
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Registros 1–2');
  });
  it('emits offsets without inventing a total', async () => {
    const fixture = await render(Pagination, { offset: 25, count: 25 });
    let offset = -1;
    fixture.componentInstance.move.subscribe((value) => (offset = value));
    fixture.nativeElement.querySelectorAll('button')[1].click();
    expect(offset).toBe(50);
  });
});
