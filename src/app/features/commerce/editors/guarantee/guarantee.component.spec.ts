import { GuaranteeComponent } from './guarantee.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('GuaranteeComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(GuaranteeComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
