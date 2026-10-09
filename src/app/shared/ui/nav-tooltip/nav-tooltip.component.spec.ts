import { NavTooltipComponent } from './nav-tooltip.component';
import { render } from '../../../testing/component-test';
describe('Navigation tooltip', () => {
  it('exposes the supplied name as text with a stable accessible description target', async () => {
    const fixture = await render(NavTooltipComponent, {
      text: '<script>Usuarios</script>',
      tooltipId: 'tip-test',
    });
    const tooltip = fixture.nativeElement.querySelector('[role="tooltip"]');
    expect(tooltip.id).toBe('tip-test');
    expect(tooltip.textContent).toBe('<script>Usuarios</script>');
    expect(tooltip.querySelector('script')).toBeNull();
  });
});
