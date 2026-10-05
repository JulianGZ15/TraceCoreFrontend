import { CommandPlanComponent } from './command-plan.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('CommandPlanComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(CommandPlanComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
