import { ComponentFixture, TestBed } from '@angular/core/testing';



import { OwnershipComponent } from './ownership.component';



describe('OwnershipComponent', () => {

  let component: OwnershipComponent;

  let fixture: ComponentFixture<OwnershipComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [OwnershipComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(OwnershipComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

