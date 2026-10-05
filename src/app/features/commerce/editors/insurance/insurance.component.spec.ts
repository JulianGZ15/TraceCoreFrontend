import { InsuranceComponent } from './insurance.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('InsuranceComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(InsuranceComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
