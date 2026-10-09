import { LookupComponent } from './lookup.component';
import { render } from '../../../../testing/component-test';
describe('LookupComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(LookupComponent, { kind: 'category', label: 'Categoría' });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Anterior');
    expect(fixture.nativeElement.textContent).not.toContain('Siguiente');
    expect(fixture.nativeElement.textContent).not.toContain('Filas');
    fixture.destroy();
  });
});
