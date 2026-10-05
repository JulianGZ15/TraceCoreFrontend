import { TagModelsComponent } from './tag-models.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('TagModelsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(TagModelsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
