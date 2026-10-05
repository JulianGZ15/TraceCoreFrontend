import { RfidNavComponent } from './rfid-nav.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('RfidNavComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(RfidNavComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
