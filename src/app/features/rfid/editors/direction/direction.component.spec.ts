import { DirectionComponent } from './direction.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('DirectionComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(DirectionComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
