import { ComponentFixture, TestBed } from '@angular/core/testing';



import { ModelDetailComponent } from './model-detail.component';



describe('ModelDetailComponent', () => {

  let component: ModelDetailComponent;

  let fixture: ComponentFixture<ModelDetailComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [ModelDetailComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(ModelDetailComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

