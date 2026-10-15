import { SectionNavComponent } from './section-nav.component';
import { renderLogistics, testId } from '../../testing';
import { FormGroup } from '@angular/forms';
describe('SectionNavComponent', () => {
  it('shows only manifest sections inside a manifest', async () => {
    const fixture = await renderLogistics(SectionNavComponent, {
      base: '/logistica/manifiestos/80000000-0000-4000-8000-000000000001',
      sections: [{ key: 'general', label: 'Resumen' }],
    });
    fixture.detectChanges();
    const navs = fixture.nativeElement.querySelectorAll('nav.page-nav');
    expect(navs).toHaveLength(1);
    expect(navs[0].textContent).toContain('Resumen');
    expect(navs[0].textContent).not.toContain('Manifiestos');
  });

  it('keeps module navigation on a logistics directory', async () => {
    const fixture = await renderLogistics(SectionNavComponent, {});
    fixture.detectChanges();
    const navs = fixture.nativeElement.querySelectorAll('nav.page-nav');
    expect(navs).toHaveLength(1);
    expect(navs[0].textContent).toContain('Manifiestos');
  });

  it('renders authorized read context without permitting a write', async () => {
    const fixture = await renderLogistics(SectionNavComponent, {});
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    const form = fixture.nativeElement.querySelector('button.btn.primary');
    if (form && form.textContent?.trim() === 'Guardar') expect(form.disabled).toBe(true);
  });
});
