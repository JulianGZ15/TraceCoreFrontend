import { ConfirmDialog } from './confirm-dialog.component';
import { render } from '../../../testing/component-test';
describe('ConfirmDialog', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(ConfirmDialog, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
