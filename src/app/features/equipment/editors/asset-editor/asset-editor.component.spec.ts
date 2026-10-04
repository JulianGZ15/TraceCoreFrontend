import { ComponentFixture, TestBed } from '@angular/core/testing';



import { AssetEditorComponent } from './asset-editor.component';



describe('AssetEditorComponent', () => {

  let component: AssetEditorComponent;

  let fixture: ComponentFixture<AssetEditorComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [AssetEditorComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(AssetEditorComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

