import { CategoriesComponent } from './categories.component';
import { render } from '../../../../testing/component-test';
describe('CategoriesComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(CategoriesComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    const component = fixture.componentInstance;
    expect(component.columns.find((column) => column.key === 'parentUuid')?.label).toBe(
      'Categoría padre',
    );
    component.parentLabels.set({ parent: 'CAT-ROOT · Válvulas' });
    expect(
      component.value(
        { uuid: 'child', parentUuid: 'parent' } as never,
        'parentUuid',
      ),
    ).toBe('CAT-ROOT · Válvulas');
    expect(component.value({ uuid: 'root', parentUuid: null } as never, 'parentUuid')).toBe(
      'Categoría raíz',
    );
    fixture.destroy();
  });
});
