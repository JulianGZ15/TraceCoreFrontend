import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassageComponent } from './passage.component';

describe('PassageComponent', () => {
  let component: PassageComponent;
  let fixture: ComponentFixture<PassageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PassageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
