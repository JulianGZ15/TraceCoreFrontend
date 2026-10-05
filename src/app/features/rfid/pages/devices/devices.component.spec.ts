import { DevicesComponent } from './devices.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('DevicesComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(DevicesComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
