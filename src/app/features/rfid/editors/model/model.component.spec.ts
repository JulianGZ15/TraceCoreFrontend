import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelComponent } from './model.component';

describe('ModelComponent', () => {
  let component: ModelComponent;
  let fixture: ComponentFixture<ModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
