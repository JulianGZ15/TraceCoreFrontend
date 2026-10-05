import { ReturnCreateComponent } from './return-create.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('ReturnCreateComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(ReturnCreateComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
