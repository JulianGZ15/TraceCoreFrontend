import { SectionNavComponent } from './section-nav.component';
import { renderFinance } from '../../testing';
describe('SectionNavComponent', () => {
  it('shows only invoice sections inside an invoice record', async () => {
    const { fixture } = await renderFinance(SectionNavComponent, {
      base: '/finanzas/facturas/90000000-0000-4000-8000-000000000001',
      sections: [{ key: 'resumen', label: 'Resumen' }],
    });
    fixture.detectChanges();
    const navs = fixture.nativeElement.querySelectorAll('nav.page-nav');
    expect(navs).toHaveLength(1);
    expect(navs[0].textContent).toContain('Resumen');
    expect(navs[0].textContent).not.toContain('Facturas');
  });

  it('keeps module navigation on a finance directory', async () => {
    const { fixture } = await renderFinance(SectionNavComponent);
    fixture.detectChanges();
    const navs = fixture.nativeElement.querySelectorAll('nav.page-nav');
    expect(navs).toHaveLength(1);
    expect(navs[0].textContent).toContain('Facturas');
  });

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
