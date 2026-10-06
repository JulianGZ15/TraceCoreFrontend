import { PartyPaymentsComponent } from './party-payments.component';
import { renderFinance } from '../../testing';
describe('PartyPaymentsComponent', () => {
  it('permite consultar la plantilla externa sin ejecutar escrituras', async () => {
    const { fixture, api } = await renderFinance(PartyPaymentsComponent, {});
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    expect(
      fixture.nativeElement.querySelectorAll('button[type=submit]:not(:disabled)').length,
    ).toBe(0);
  });
});
