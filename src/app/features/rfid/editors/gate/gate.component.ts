import {Component} from '@angular/core';import {ReactiveFormsModule,Validators} from '@angular/forms';
import {Feedback} from '../../../../shared/ui/page';import {RfidEditor} from '../../editor-base';import {uuidPattern} from '../../rules';import {ScanPickerComponent} from '../../selectors/scan-picker/scan-picker.component';import * as M from '../../models';
@Component({selector:'tc-rfid-gate-editor',imports:[ReactiveFormsModule,Feedback],templateUrl:'./gate.component.html',styleUrl:'./gate.component.scss'})
export class GateComponent extends RfidEditor {
 readonly capability='RFID_DEVICE_MANAGE';override readonly globalOperation=false;
 readonly form=this.fb.nonNullable.group({ uuid:[crypto.randomUUID(),this.uuid],
 yardUuid:['',this.uuid],
 code:['',[this.required,Validators.maxLength(80)]],
 name:['',[this.required,Validators.maxLength(150)]]});
 readonly editing=!!this.data.uuid;
 ngOnInit(){if(this.data.row)this.form.patchValue(this.data.row as never);this.form.markAsPristine();}
 pick(key:string,value:string){this.form.get(key)?.setValue(value);this.form.markAsDirty();}
 async save(){await this.saveWith(()=>this.api.post('/gates',this.form.getRawValue()));}
}
