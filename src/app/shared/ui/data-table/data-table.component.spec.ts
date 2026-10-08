import { TestBed } from '@angular/core/testing';
import { DataTableHost } from '../../../testing/data-table-host.component';

describe('DataTable', () => {
  async function render() {
    await TestBed.configureTestingModule({ imports: [DataTableHost] }).compileComponents();
    const fixture = TestBed.createComponent(DataTableHost);
    await fixture.whenStable();
    return fixture;
  }

  it('projects a native table, heading and footer into separate accessible zones', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    const region = root.querySelector('.tc-table-scroll')!;
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-label')).toBe('Piezas recibidas');
    expect(region.getAttribute('aria-busy')).toBe('false');
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(region.querySelector('table caption')?.textContent?.trim()).toBe('Piezas recibidas');
    expect(region.querySelector('tc-pagination')).toBeNull();
    expect(root.querySelector('.tc-table-heading h2')?.textContent?.trim()).toBe('Recepción');
    expect(root.querySelector('.tc-table-footer tc-pagination')).toBeTruthy();
  });

  it('keeps rows, selection, event handlers and an edited draft during refreshes', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    const row = root.querySelector('tbody tr');
    const input = root.querySelector<HTMLInputElement>('input:not([type=checkbox])')!;
    input.value = 'Captura conservada';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    root.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    root.querySelector<HTMLButtonElement>('tbody button')!.click();
    fixture.componentInstance.busy.set(true);
    await fixture.whenStable();
    expect(root.querySelector('tbody tr')).toBe(row);
    expect(input.value).toBe('Captura conservada');
    expect(fixture.componentInstance.observation.value).toBe('Captura conservada');
    expect(fixture.componentInstance.selected).toBe(true);
    expect(fixture.componentInstance.opens).toBe(1);
    expect(root.querySelector('.tc-table-scroll')?.getAttribute('aria-busy')).toBe('true');
    expect(input.disabled).toBe(false);
    fixture.componentInstance.busy.set(false);
    await fixture.whenStable();
    root.querySelectorAll<HTMLButtonElement>('tc-pagination button')[1].click();
    expect(fixture.componentInstance.offset).toBe(25);
  });

  it('integrates with ListContainer with one scroll region and no nested panel', async () => {
    const fixture = await render();
    fixture.componentInstance.visible.set(false);
    fixture.componentInstance.inList.set(true);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('[role=region]').length).toBe(1);
    expect(root.querySelectorAll('.tc-table-panel').length).toBe(0);
    expect(root.querySelector('tc-data-table')?.classList.contains('tc-table-fill')).toBe(true);
    expect(root.querySelector('.list-zone-pagination tc-pagination')).toBeTruthy();
  });
});
