import { ComponentFixture, TestBed } from '@angular/core/testing';



import { AssetTechnicalComponent } from './asset-technical.component';



describe('AssetTechnicalComponent', () => {

  let component: AssetTechnicalComponent;

  let fixture: ComponentFixture<AssetTechnicalComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [AssetTechnicalComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(AssetTechnicalComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

