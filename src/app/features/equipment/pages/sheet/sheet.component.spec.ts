import { ComponentFixture, TestBed } from '@angular/core/testing';



import { SheetComponent } from './sheet.component';



describe('SheetComponent', () => {

  let component: SheetComponent;

  let fixture: ComponentFixture<SheetComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [SheetComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(SheetComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

