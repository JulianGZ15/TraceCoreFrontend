import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchToolbarComponent } from './search-toolbar.component';

describe('SearchToolbarComponent', () => {
  let component: SearchToolbarComponent;
  let fixture: ComponentFixture<SearchToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit search on submitSearch', () => {
    let emitted = '';
    component.search.subscribe((val) => (emitted = val));
    component.term.set('  empresa abc  ');
    component.submitSearch();
    expect(emitted).toBe('empresa abc');
  });

  it('should clear term and emit empty search on clearSearch', () => {
    let emitted = 'initial';
    component.search.subscribe((val) => (emitted = val));
    component.term.set('test');
    component.clearSearch();
    expect(component.term()).toBe('');
    expect(emitted).toBe('');
  });

  it('should emit openFilters when filter button clicked', () => {
    let opened = false;
    component.openFilters.subscribe(() => (opened = true));
    component.openFilters.emit();
    expect(opened).toBe(true);
  });
});
