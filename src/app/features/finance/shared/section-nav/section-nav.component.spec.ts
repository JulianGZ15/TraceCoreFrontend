import { SectionNavComponent } from './section-nav.component';
import { renderFinance } from '../../testing';
describe('SectionNavComponent', () => {
  it('permite consultar la plantilla externa sin ejecutar escrituras', async () => {
    const { fixture, api } = await renderFinance(SectionNavComponent, {
      base: '/finanzas/terceros/90000000-0000-4000-8000-000000000001',
      currency: 'USD',
      sections: [{ key: 'credito', label: 'Crédito' }],
    });
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    expect(
      fixture.nativeElement.querySelectorAll('button[type=submit]:not(:disabled)').length,
    ).toBe(0);
  });
});
