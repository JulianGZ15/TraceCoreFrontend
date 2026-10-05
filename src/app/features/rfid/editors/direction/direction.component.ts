import {Component} from '@angular/core';import {ReactiveFormsModule,Validators} from '@angular/forms';
import {Feedback} from '../../../../shared/ui/page';import {RfidEditor} from '../../editor-base';import {uuidPattern} from '../../rules';import {ScanPickerComponent} from '../../selectors/scan-picker/scan-picker.component';import * as M from '../../models';
@Component({selector:'tc-rfid-direction-editor',imports:[ReactiveFormsModule,Feedback],templateUrl:'./direction.component.html',styleUrl:'./direction.component.scss'})
export class DirectionComponent extends RfidEditor {
 readonly capability='RFID_SCAN';override readonly globalOperation=false;
 readonly form=this.fb.nonNullable.group({ direction:['UNKNOWN',[this.required]],
 reason:['',[this.required,Validators.maxLength(500)]]});
 readonly editing=!!this.data.uuid;
 ngOnInit(){if(this.data.row)this.form.patchValue(this.data.row as never);this.form.markAsPristine();}
 pick(key:string,value:string){this.form.get(key)?.setValue(value);this.form.markAsDirty();}
 async save(){await this.saveWith(()=>this.api.put('/passages/'+this.data.uuid+'/direction',{...this.form.getRawValue(),version:this.data.version}));}
}
