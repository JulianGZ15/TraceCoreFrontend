import { AuditDetail } from './audit-detail.component';
import { render } from '../../../testing/component-test';
describe('AuditDetail', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(AuditDetail, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
