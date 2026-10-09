import { TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';
import { Session } from '../../auth/session';
import { Navigation } from './navigation.component';
import { render } from '../../../testing/component-test';
describe('Navigation', () => {
  it('emits an expansion request without changing permissions or accessible names', async () => {
    TestBed.overrideProvider(DialogRef, { useValue: null });
    const fixture = await render(Navigation, { collapsed: true });
    const toggle = fixture.nativeElement.querySelector('.sidebar-toggle');
    const request = vi.fn();
    fixture.componentInstance.toggleCollapsed.subscribe(request);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    expect(request).toHaveBeenCalledOnce();
    const users = fixture.nativeElement.querySelector('a[aria-label="Usuarios"]');
    expect(users.querySelector('.nav-text').classList.contains('sr-only')).toBe(true);
    expect(fixture.nativeElement.querySelector('a[aria-label="Finanzas"]')).toBeNull();
    fixture.componentRef.setInput('collapsed', false);
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(users.querySelector('.nav-text').classList.contains('sr-only')).toBe(false);
  });
  it('uses the isotipo and keeps mobile navigation expanded with a close action', async () => {
    const fixture = await render(Navigation);
    expect(fixture.nativeElement.querySelector('.sidebar-toggle')).toBeNull();
    expect(fixture.nativeElement.querySelector('.navigation').classList.contains('collapsed')).toBe(
      false,
    );
    expect(fixture.nativeElement.querySelector('tc-brand-logo img').getAttribute('src')).toContain(
      'tracecore-isotipo.svg',
    );
    const close = vi.spyOn(TestBed.inject(DialogRef), 'close');
    fixture.nativeElement.querySelector('.nav-close').click();
    expect(close).toHaveBeenCalledOnce();
  });
  it('retains the logout action in collapsed mode', async () => {
    const fixture = await render(Navigation, { collapsed: true });
    const logout = vi.spyOn(TestBed.inject(Session), 'logout');
    fixture.nativeElement.querySelector('button[aria-label="Cerrar sesión"]').click();
    expect(logout).toHaveBeenCalledOnce();
  });
});
