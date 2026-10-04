import { ComponentFixture, TestBed } from '@angular/core/testing';



import { AssetLotsComponent } from './asset-lots.component';



describe('AssetLotsComponent', () => {

  let component: AssetLotsComponent;

  let fixture: ComponentFixture<AssetLotsComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [AssetLotsComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(AssetLotsComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

