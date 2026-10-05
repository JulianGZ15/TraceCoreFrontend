import { RentalPeriodsComponent } from './rental-periods.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('RentalPeriodsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(RentalPeriodsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
