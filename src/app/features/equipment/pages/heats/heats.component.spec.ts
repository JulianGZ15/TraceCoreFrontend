import { ComponentFixture, TestBed } from '@angular/core/testing';



import { HeatsComponent } from './heats.component';



describe('HeatsComponent', () => {

  let component: HeatsComponent;

  let fixture: ComponentFixture<HeatsComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [HeatsComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(HeatsComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

