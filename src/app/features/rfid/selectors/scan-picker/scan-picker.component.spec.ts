import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanPickerComponent } from './scan-picker.component';

describe('ScanPickerComponent', () => {
  let component: ScanPickerComponent;
  let fixture: ComponentFixture<ScanPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScanPickerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
