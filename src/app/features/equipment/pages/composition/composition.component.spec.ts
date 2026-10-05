import { CompositionComponent } from './composition.component';
import { render } from '../../../../testing/component-test';
describe('CompositionComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(CompositionComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
