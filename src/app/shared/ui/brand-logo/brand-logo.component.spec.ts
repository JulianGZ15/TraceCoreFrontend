import { BrandLogo } from './brand-logo.component';
import { render } from '../../../testing/component-test';
describe('BrandLogo', () => {
  it('loads the derived isotipo with its own intrinsic proportions', async () => {
    const fixture = await render(BrandLogo, { variant: 'isotype' });
    const logo = fixture.nativeElement.querySelector('img');
    expect(logo.getAttribute('src')).toBe('assets/brand/tracecore-isotipo.svg');
    expect(logo.getAttribute('width')).toBe('730');
    expect(logo.getAttribute('height')).toBe('490');
    expect(logo.alt).toBe('TraceCore');
  });
  it('loads the canonical local vector without altering intrinsic proportions', async () => {
    const fixture = await render(BrandLogo, { variant: 'login' });
    const logo = fixture.nativeElement.querySelector('img');
    expect(logo.getAttribute('src')).toBe('assets/brand/tracecore-colores-planos.svg');
    expect(logo.getAttribute('width')).toBe('1300');
    expect(logo.getAttribute('height')).toBe('710');
    expect(logo.alt).toBe('TraceCore');
    expect(logo.classList.contains('login')).toBe(true);
  });
  it('hides duplicate branding from screen readers when decorative', async () => {
    const fixture = await render(BrandLogo, { decorative: true });
    expect(fixture.nativeElement.querySelector('img').alt).toBe('');
  });
});
