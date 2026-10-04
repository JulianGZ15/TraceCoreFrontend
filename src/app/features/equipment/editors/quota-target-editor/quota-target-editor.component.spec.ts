import { ComponentFixture, TestBed } from '@angular/core/testing';



import { QuotaTargetEditorComponent } from './quota-target-editor.component';



describe('QuotaTargetEditorComponent', () => {

  let component: QuotaTargetEditorComponent;

  let fixture: ComponentFixture<QuotaTargetEditorComponent>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [QuotaTargetEditorComponent],

    }).compileComponents();



    fixture = TestBed.createComponent(QuotaTargetEditorComponent);

    component = fixture.componentInstance;

    await fixture.whenStable();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });

});

