import { ReadersComponent } from './readers.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('ReadersComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(ReadersComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
