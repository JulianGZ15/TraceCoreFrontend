import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FilterDrawerComponent, FilterDrawerData } from './filter-drawer.component';

describe('FilterDrawerComponent', () => {
  let component: FilterDrawerComponent;
  let fixture: ComponentFixture<FilterDrawerComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockData: FilterDrawerData;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockData = {
      title: 'Filtros de prueba',
      template: null as any,
      onApply: vi.fn(),
      onClear: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FilterDrawerComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: mockData },
        { provide: DialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call onApply and close with true', async () => {
    await component.apply();
    expect(mockData.onApply).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should call onClear on clear', async () => {
    await component.clear();
    expect(mockData.onClear).toHaveBeenCalled();
  });

  it('should close with false on cancel/close', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
