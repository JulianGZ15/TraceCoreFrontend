import {Component} from '@angular/core';import {ReactiveFormsModule,Validators} from '@angular/forms';
import {Feedback} from '../../../../shared/ui/page';import {RfidEditor} from '../../editor-base';import {uuidPattern} from '../../rules';import {ScanPickerComponent} from '../../selectors/scan-picker/scan-picker.component';import * as M from '../../models';
@Component({selector:'tc-rfid-device-editor',imports:[ReactiveFormsModule,Feedback,ScanPickerComponent],templateUrl:'./device.component.html',styleUrl:'./device.component.scss'})
export class DeviceComponent extends RfidEditor {
 readonly capability='RFID_DEVICE_MANAGE';override readonly globalOperation=true;
 readonly form=this.fb.nonNullable.group({ uuid:[crypto.randomUUID(),this.uuid],
 readerUuid:['',this.uuid],
 yardUuid:['',this.uuid],
 kind:['DESKTOP',[this.required]],
 active:[true,[]]});
 readonly editing=!!this.data.uuid;
 ngOnInit(){if(this.data.row)this.form.patchValue(this.data.row as never);this.form.markAsPristine();}
 pick(key:string,value:string){this.form.get(key)?.setValue(value);this.form.markAsDirty();}
 async save(){await this.saveWith(()=>{const data={...this.form.getRawValue()};const normalized=data;return this.editing?this.api.put<M.RemoteRow>('/devices/'+this.data.uuid,{data:normalized,version:this.data.version,actorUuid:this.session.user()!.uuid}):this.api.post('/devices',normalized);});}
}
