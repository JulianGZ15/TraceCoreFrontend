import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntitySearchComponent, EntityOption } from './entity-search.component';

describe('EntitySearchComponent', () => {
  let component: EntitySearchComponent;
  let fixture: ComponentFixture<EntitySearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntitySearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntitySearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit selected option when clicked', () => {
    let selected: EntityOption | null = null;
    component.select.subscribe((val) => (selected = val));

    const opt: EntityOption = { value: '123', label: 'Proveedor Alfa' };
    component.selectOption(opt);

    expect(selected).toEqual(opt);
    expect(component.currentLabel()).toBe('Proveedor Alfa');
  });

  it('should emit null on clearSelection', () => {
    let selected: EntityOption | null = { value: 'old', label: 'Old' };
    component.select.subscribe((val) => (selected = val));

    component.clearSelection();
    expect(selected).toBeNull();
    expect(component.currentLabel()).toBe('');
  });

  it('loads suggestions, exposes the empty state, and accepts keyboard selection', async () => {
    fixture.componentRef.setInput('searchFn', async (query: string) =>
      query === 'none' ? [] : [{ value: '123', label: 'Proveedor Alfa' }],
    );
    await component.performSearch('none');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se encontraron resultados');

    await component.performSearch('proveedor');
    fixture.detectChanges();
    let selected: EntityOption | null = null;
    component.select.subscribe((value) => (selected = value));
    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    component.onKeydown(down);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(down.defaultPrevented).toBe(true);
    expect(selected).toEqual({ value: '123', label: 'Proveedor Alfa' });
  });

  it('keeps the latest results when searches resolve out of order', async () => {
    let finishOld!: (value: EntityOption[]) => void;
    fixture.componentRef.setInput(
      'searchFn',
      (query: string) =>
        query === 'old'
          ? new Promise<EntityOption[]>((resolve) => (finishOld = resolve))
          : Promise.resolve([{ value: 'new', label: 'Resultado nuevo' }]),
    );
    const oldSearch = component.performSearch('old');
    await component.performSearch('new');
    finishOld([{ value: 'old', label: 'Resultado viejo' }]);
    await oldSearch;
    expect(component.options()).toEqual([{ value: 'new', label: 'Resultado nuevo' }]);
  });

  it('skips disabled suggestions during keyboard navigation', () => {
    component.options.set([
      { value: 'disabled', label: 'No disponible', disabled: true },
      { value: 'enabled', label: 'Disponible' },
    ]);
    component.open.set(true);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    expect(component.activeIndex()).toBe(1);
  });
});
