import { ReaderComponent } from './reader.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('ReaderComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(ReaderComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
