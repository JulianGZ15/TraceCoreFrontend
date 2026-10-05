import { SheetComponent } from './sheet.component';
import { render } from '../../../../testing/component-test';
describe('SheetComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(SheetComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
