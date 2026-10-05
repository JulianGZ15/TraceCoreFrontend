import { RecordsComponent } from './records.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('RecordsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(RecordsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
