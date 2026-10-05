import { GradesComponent } from './grades.component';
import { render } from '../../../../testing/component-test';
describe('GradesComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(GradesComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
