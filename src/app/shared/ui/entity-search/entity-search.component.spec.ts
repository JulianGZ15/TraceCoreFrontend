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
});
