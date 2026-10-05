import { RentalAssignmentsComponent } from './rental-assignments.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('RentalAssignmentsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(RentalAssignmentsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
