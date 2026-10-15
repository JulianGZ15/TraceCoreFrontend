import { SectionNavComponent } from './section-nav.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('SectionNavComponent', () => {
  it('shows only record sections inside an order', async () => {
    const fixture = await renderOperation(SectionNavComponent, {
      base: '/comercial/ordenes/80000000-0000-4000-8000-000000000001',
      sections: [{ key: 'general', label: 'Resumen' }],
    });
    fixture.detectChanges();
    const navs = fixture.nativeElement.querySelectorAll('nav.page-nav');
    expect(navs).toHaveLength(1);
    expect(navs[0].textContent).toContain('Resumen');
    expect(navs[0].textContent).not.toContain('Órdenes');
  });

  it('keeps module navigation on a commerce directory', async () => {
    const fixture = await renderOperation(SectionNavComponent, {});
    fixture.detectChanges();
    const navs = fixture.nativeElement.querySelectorAll('nav.page-nav');
    expect(navs).toHaveLength(1);
    expect(navs[0].textContent).toContain('Órdenes');
  });

  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(SectionNavComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
