import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagModelsComponent } from './tag-models.component';

describe('TagModelsComponent', () => {
  let component: TagModelsComponent;
  let fixture: ComponentFixture<TagModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagModelsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TagModelsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
