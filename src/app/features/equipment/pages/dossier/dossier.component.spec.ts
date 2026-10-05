import { DossierComponent } from './dossier.component';
import { render } from '../../../../testing/component-test';
describe('DossierComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(DossierComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
