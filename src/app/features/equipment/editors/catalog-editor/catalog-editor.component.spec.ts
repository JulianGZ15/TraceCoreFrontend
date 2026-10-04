import { ComponentFixture, TestBed } from '@angular/core/testing';



import { CatalogEditorComponent } from './catalog-editor.component';



describe('CatalogEditorComponent', () => {

  let component: CatalogEditorComponent;

  let fixture: ComponentFixture<CatalogEditorComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [CatalogEditorComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(CatalogEditorComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

