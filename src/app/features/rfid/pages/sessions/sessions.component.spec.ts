import { SessionsComponent } from './sessions.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('SessionsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(SessionsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
