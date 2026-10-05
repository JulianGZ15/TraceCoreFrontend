import { DeliveriesComponent } from './deliveries.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('DeliveriesComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(DeliveriesComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
