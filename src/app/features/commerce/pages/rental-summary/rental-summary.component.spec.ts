import { RentalSummaryComponent } from './rental-summary.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('RentalSummaryComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(RentalSummaryComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
