import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionPlanComponent } from './session-plan.component';

describe('SessionPlanComponent', () => {
  let component: SessionPlanComponent;
  let fixture: ComponentFixture<SessionPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionPlanComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionPlanComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
