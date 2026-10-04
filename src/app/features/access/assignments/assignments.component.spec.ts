import { AssignmentsPanel } from './assignments.component';
import { render } from '../../../testing/component-test';
describe('AssignmentsPanel', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(AssignmentsPanel, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
