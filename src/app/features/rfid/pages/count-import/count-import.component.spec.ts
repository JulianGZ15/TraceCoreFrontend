import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountImportComponent } from './count-import.component';

describe('CountImportComponent', () => {
  let component: CountImportComponent;
  let fixture: ComponentFixture<CountImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountImportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CountImportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
