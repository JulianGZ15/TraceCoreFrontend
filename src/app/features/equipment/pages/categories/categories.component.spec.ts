import { CategoriesComponent } from './categories.component';
import { render } from '../../../../testing/component-test';
describe('CategoriesComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(CategoriesComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
