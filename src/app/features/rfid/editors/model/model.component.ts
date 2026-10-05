import {Component} from '@angular/core';import {ReactiveFormsModule,Validators} from '@angular/forms';
import {Feedback} from '../../../../shared/ui/page';import {RfidEditor} from '../../editor-base';import {uuidPattern} from '../../rules';import {ScanPickerComponent} from '../../selectors/scan-picker/scan-picker.component';import * as M from '../../models';
@Component({selector:'tc-rfid-model-editor',imports:[ReactiveFormsModule,Feedback],templateUrl:'./model.component.html',styleUrl:'./model.component.scss'})
export class ModelComponent extends RfidEditor {
 readonly capability='RFID_TAG_MANAGE';override readonly globalOperation=true;
 readonly form=this.fb.nonNullable.group({ uuid:[crypto.randomUUID(),this.uuid],
 manufacturer:['',[this.required,Validators.maxLength(120)]],
 model:['',[this.required,Validators.maxLength(120)]],
 epcCapacityBits:[128,[Validators.required,Validators.min(128),Validators.max(512)]],
 serializedTid:[true,[]]});
 readonly editing=!!this.data.uuid;
 ngOnInit(){if(this.data.row)this.form.patchValue(this.data.row as never);this.form.markAsPristine();}
 pick(key:string,value:string){this.form.get(key)?.setValue(value);this.form.markAsDirty();}
 async save(){if(this.form.controls.epcCapacityBits.value%8!==0){this.error.set('La capacidad debe ser múltiplo de ocho bits.');return;}await this.saveWith(()=>this.api.post('/tag-models',this.form.getRawValue()));}
}
