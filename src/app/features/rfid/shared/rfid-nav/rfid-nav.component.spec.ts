import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfidNavComponent } from './rfid-nav.component';

describe('RfidNavComponent', () => {
  let component: RfidNavComponent;
  let fixture: ComponentFixture<RfidNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfidNavComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RfidNavComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
