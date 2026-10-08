import { Spinner } from './spinner.component';
import { render } from '../../../testing/component-test';
describe('Spinner', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(Spinner, { message: 'Cargando...', size: 'sm' });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('Cargando...');
  });
});
