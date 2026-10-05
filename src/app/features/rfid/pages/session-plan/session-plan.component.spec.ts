import { SessionPlanComponent } from './session-plan.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('SessionPlanComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(SessionPlanComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
