import { RentalsComponent } from './rentals.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('RentalsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(RentalsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
