import { SectionNavigationComponent } from './section-navigation.component';
import { render } from '../../../../testing/component-test';
describe('SectionNavigationComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(SectionNavigationComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
