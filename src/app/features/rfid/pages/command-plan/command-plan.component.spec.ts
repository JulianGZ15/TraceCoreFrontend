import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandPlanComponent } from './command-plan.component';

describe('CommandPlanComponent', () => {
  let component: CommandPlanComponent;
  let fixture: ComponentFixture<CommandPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPlanComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPlanComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
