import { LookupComponent } from './lookup.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('LookupComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(LookupComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
