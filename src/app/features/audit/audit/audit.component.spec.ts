import { AuditPage } from './audit.component';
import { render } from '../../../testing/component-test';
describe('AuditPage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(AuditPage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
