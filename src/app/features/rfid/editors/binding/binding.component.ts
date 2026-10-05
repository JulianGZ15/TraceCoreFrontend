import {Component} from '@angular/core';import {ReactiveFormsModule,Validators} from '@angular/forms';
import {Feedback} from '../../../../shared/ui/page';import {RfidEditor} from '../../editor-base';import {uuidPattern} from '../../rules';import {ScanPickerComponent} from '../../selectors/scan-picker/scan-picker.component';import * as M from '../../models';
@Component({selector:'tc-rfid-binding-editor',imports:[ReactiveFormsModule,Feedback],templateUrl:'./binding.component.html',styleUrl:'./binding.component.scss'})
export class BindingComponent extends RfidEditor {
 readonly capability='RFID_TAG_MANAGE';override readonly globalOperation=false;
 readonly form=this.fb.nonNullable.group({ expectedAssignmentUuid:['',[Validators.pattern(uuidPattern)]],
 reason:['',[this.required,Validators.maxLength(500)]],
 retirementReference:['',[Validators.maxLength(500)]]});
 readonly editing=!!this.data.uuid;
 ngOnInit(){if(this.data.row)this.form.patchValue(this.data.row as never);this.form.markAsPristine();}
 pick(key:string,value:string){this.form.get(key)?.setValue(value);this.form.markAsDirty();}
 async save(){if(this.data.expectedAssignmentUuid&&!this.form.controls.retirementReference.value.trim()){this.error.set('La sustitución exige referencia del retiro físico.');return;}await this.saveWith(()=>this.api.post('/commands/'+this.data.uuid+'/confirm-binding',{...this.form.getRawValue(),expectedAssignmentUuid:this.data.expectedAssignmentUuid??null,retirementReference:this.form.controls.retirementReference.value||null}));}
}
