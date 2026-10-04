import { ComponentFixture, TestBed } from '@angular/core/testing';



import { AssetGeneralComponent } from './asset-general.component';



describe('AssetGeneralComponent', () => {

  let component: AssetGeneralComponent;

  let fixture: ComponentFixture<AssetGeneralComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [AssetGeneralComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(AssetGeneralComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

