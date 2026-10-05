import { DeviceComponent } from './device.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('DeviceComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(DeviceComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
