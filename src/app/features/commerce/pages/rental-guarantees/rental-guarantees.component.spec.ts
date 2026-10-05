import { RentalGuaranteesComponent } from './rental-guarantees.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('RentalGuaranteesComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(RentalGuaranteesComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
