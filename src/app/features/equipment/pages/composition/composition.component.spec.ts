import { ComponentFixture, TestBed } from '@angular/core/testing';



import { CompositionComponent } from './composition.component';



describe('CompositionComponent', () => {

  let component: CompositionComponent;

  let fixture: ComponentFixture<CompositionComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [CompositionComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(CompositionComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

