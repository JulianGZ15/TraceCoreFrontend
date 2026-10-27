import { AccountsComponent } from './accounts.component';
import { renderFinance } from '../../testing';
describe('AccountsComponent', () => {
  it('permite consultar la plantilla externa sin ejecutar escrituras', async () => {
    const { fixture, api } = await renderFinance(AccountsComponent, {});
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    expect(
      fixture.nativeElement.querySelectorAll('button[type=submit]:not(:disabled)').length,
    ).toBe(0);
  });

  it('uses the published credit-account directory contract', async () => {
    const { fixture } = await renderFinance(AccountsComponent, {});

    expect(fixture.componentInstance.collection).toBe('credit-accounts/directory');
  });
});
