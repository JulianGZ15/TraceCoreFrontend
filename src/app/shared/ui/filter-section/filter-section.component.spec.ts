import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterSectionComponent } from './filter-section.component';

describe('FilterSectionComponent', () => {
  let component: FilterSectionComponent;
  let fixture: ComponentFixture<FilterSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Clasificación');
    fixture.detectChanges();
  });

  it('should create and render title', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('legend')?.textContent).toContain('Clasificación');
  });
});
