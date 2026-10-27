import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
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

  it('valida la selección real aunque se escriba una búsqueda y asocia el error al control', async () => {
    const control = new FormControl('', Validators.required);
    fixture.componentRef.setInput('validationControl', control);
    fixture.componentRef.setInput('describedBy', 'selection-error');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.hasAttribute('aria-invalid')).toBe(false);

    input.value = 'Solo una búsqueda';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(control.value).toBe('');
    expect(control.touched).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('selection-error');

    control.setValue('selected');
    fixture.componentRef.setInput('value', 'selected');
    fixture.detectChanges(false);
    expect(fixture.nativeElement.querySelector('[aria-invalid="true"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Registro seleccionado');
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

  it('separa el error de carga del estado sin resultados y ofrece reintentar', async () => {
    const search = vi.fn(async () => []);
    fixture.componentRef.setInput('searchFn', search);
    fixture.componentRef.setInput('searchError', 'No se pudo consultar el servicio.');
    component.onFocus();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar las opciones.');
    expect(fixture.nativeElement.textContent).not.toContain('No se encontraron resultados');
    const retry = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    retry.click();
    await fixture.whenStable();
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('keeps the latest results when searches resolve out of order', async () => {
    let finishOld!: (value: EntityOption[]) => void;
    fixture.componentRef.setInput('searchFn', (query: string) =>
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

  it('never displays a selected UUID and caps suggestions at 25', async () => {
    const uuid = '1a8a6df8-064a-48e7-b361-7fe599a140aa';
    fixture.componentRef.setInput('value', uuid);
    fixture.componentRef.setInput('searchFn', async () =>
      Array.from({ length: 30 }, (_, i) => ({ value: `id-${i}`, label: `Registro ${i}` })),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(uuid);
    expect(component.currentLabel()).toBe('Registro seleccionado');
    await component.performSearch('registro');
    expect(component.options()).toHaveLength(25);
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
