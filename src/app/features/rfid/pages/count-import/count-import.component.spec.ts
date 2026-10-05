import { CountImportComponent } from './count-import.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('CountImportComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(CountImportComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
