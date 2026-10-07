import { PageNav, PageNavItem } from './page-nav.component';
import { render } from '../../../testing/component-test';

describe('PageNav', () => {
  const sampleItems: PageNavItem[] = [
    { label: 'Equipos', route: '/rfid/equipos' },
    { label: 'Sesiones', route: '/rfid/sesiones', badge: 3 },
    { label: 'Oculto', route: '/rfid/oculto', visible: false },
  ];

  it('renders visible tabs with accessible markup', async () => {
    const fixture = await render(PageNav, { items: sampleItems, ariaLabel: 'Secciones RFID' });
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Secciones RFID');

    const tabs = fixture.nativeElement.querySelectorAll('.nav-tab');
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('Equipos');
    expect(tabs[1].textContent).toContain('Sesiones');
    expect(tabs[1].querySelector('.tab-badge')?.textContent).toBe('3');
  });

  it('adjusts scroll left without moving window', async () => {
    const fixture = await render(PageNav, { items: sampleItems });
    fixture.detectChanges();

    const instance = fixture.componentInstance;
    expect(() => instance.scrollToActiveTab()).not.toThrow();
  });
});
