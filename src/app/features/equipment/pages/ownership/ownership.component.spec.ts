import { OwnershipComponent } from './ownership.component';
import { render } from '../../../../testing/component-test';
describe('OwnershipComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(OwnershipComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
