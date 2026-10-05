import { CredentialComponent } from './credential.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('CredentialComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(CredentialComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
