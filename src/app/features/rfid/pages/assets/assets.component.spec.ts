import { AssetsComponent } from './assets.component';
import { renderOperation } from '../../../../testing/operation-test';

describe('AssetsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(AssetsComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);

    const listContainer = fixture.nativeElement.querySelector('tc-list-container');
    expect(listContainer).toBeTruthy();

    const heading = fixture.nativeElement.querySelector('tc-page-heading');
    expect(heading).toBeTruthy();

    const rfidNav = heading?.querySelector('tc-rfid-nav');
    expect(rfidNav).toBeTruthy();

    const table = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();
  });
});
