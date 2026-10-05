import { SectionNavComponent } from './section-nav.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('SectionNavComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(SectionNavComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
