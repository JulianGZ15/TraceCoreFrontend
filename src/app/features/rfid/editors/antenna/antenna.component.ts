import {Component} from '@angular/core';import {ReactiveFormsModule,Validators} from '@angular/forms';
import {Feedback} from '../../../../shared/ui/page';import {RfidEditor} from '../../editor-base';import {uuidPattern} from '../../rules';import {ScanPickerComponent} from '../../selectors/scan-picker/scan-picker.component';import * as M from '../../models';
@Component({selector:'tc-rfid-antenna-editor',imports:[ReactiveFormsModule,Feedback,ScanPickerComponent],templateUrl:'./antenna.component.html',styleUrl:'./antenna.component.scss'})
export class AntennaComponent extends RfidEditor {
 readonly capability='RFID_DEVICE_MANAGE';override readonly globalOperation=true;
 readonly form=this.fb.nonNullable.group({ uuid:[crypto.randomUUID(),this.uuid],
 readerUuid:['',this.uuid],
 gateUuid:['',[Validators.pattern(uuidPattern)]],
 port:[1,[Validators.required,Validators.min(1),Validators.max(64)]],
 name:['',[this.required,Validators.maxLength(150)]],
 active:[true,[]]});
 readonly editing=!!this.data.uuid;
 ngOnInit(){if(this.data.row)this.form.patchValue(this.data.row as never);this.form.markAsPristine();}
 pick(key:string,value:string){this.form.get(key)?.setValue(value);this.form.markAsDirty();}
 async save(){await this.saveWith(()=>{const data={...this.form.getRawValue()};const normalized={...data,gateUuid:data.gateUuid||null};return this.editing?this.api.put<M.RemoteRow>('/antennas/'+this.data.uuid,{data:normalized,version:this.data.version,actorUuid:this.session.user()!.uuid}):this.api.post('/antennas',normalized);});}
}
