import { ComponentFixture, TestBed } from '@angular/core/testing';



import { RelationshipEditorComponent } from './relationship-editor.component';



describe('RelationshipEditorComponent', () => {

  let component: RelationshipEditorComponent;

  let fixture: ComponentFixture<RelationshipEditorComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [RelationshipEditorComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(RelationshipEditorComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

