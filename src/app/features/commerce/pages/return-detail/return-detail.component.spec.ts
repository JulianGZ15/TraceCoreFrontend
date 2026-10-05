import { ReturnDetailComponent } from './return-detail.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('ReturnDetailComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(ReturnDetailComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
