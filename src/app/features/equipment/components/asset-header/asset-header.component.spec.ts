import { ComponentFixture, TestBed } from '@angular/core/testing';



import { AssetHeaderComponent } from './asset-header.component';



describe('AssetHeaderComponent', () => {

  let component: AssetHeaderComponent;

  let fixture: ComponentFixture<AssetHeaderComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [AssetHeaderComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(AssetHeaderComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

