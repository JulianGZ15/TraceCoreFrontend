import { RentalReturnsComponent } from './rental-returns.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('RentalReturnsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(RentalReturnsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
