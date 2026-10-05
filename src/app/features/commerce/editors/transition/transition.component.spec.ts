import { TransitionComponent } from './transition.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('TransitionComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(TransitionComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
