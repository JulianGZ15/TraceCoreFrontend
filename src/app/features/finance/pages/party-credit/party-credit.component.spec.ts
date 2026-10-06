import { PartyCreditComponent } from './party-credit.component';
import { renderFinance } from '../../testing';
describe('PartyCreditComponent', () => {
  it('permite consultar la plantilla externa sin ejecutar escrituras', async () => {
    const { fixture, api } = await renderFinance(PartyCreditComponent, {});
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    expect(
      fixture.nativeElement.querySelectorAll('button[type=submit]:not(:disabled)').length,
    ).toBe(0);
  });
});
