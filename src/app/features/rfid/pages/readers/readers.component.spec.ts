import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadersComponent } from './readers.component';

describe('ReadersComponent', () => {
  let component: ReadersComponent;
  let fixture: ComponentFixture<ReadersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadersComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
