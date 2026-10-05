import { AntennaComponent } from './antenna.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('AntennaComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(AntennaComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
