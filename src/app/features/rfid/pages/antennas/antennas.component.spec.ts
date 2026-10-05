import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AntennasComponent } from './antennas.component';

describe('AntennasComponent', () => {
  let component: AntennasComponent;
  let fixture: ComponentFixture<AntennasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AntennasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AntennasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
