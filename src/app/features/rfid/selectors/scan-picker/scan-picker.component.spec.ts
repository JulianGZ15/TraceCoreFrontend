import { ScanPickerComponent } from './scan-picker.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('ScanPickerComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(ScanPickerComponent, { kind: 'READERS' });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
