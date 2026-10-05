import { LotDetailComponent } from './lot-detail.component';
import { render } from '../../../../testing/component-test';
describe('LotDetailComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(LotDetailComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
