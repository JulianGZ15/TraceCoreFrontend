import {Component} from '@angular/core';import {ReactiveFormsModule,Validators} from '@angular/forms';
import {Feedback} from '../../../../shared/ui/page';import {RfidEditor} from '../../editor-base';import {uuidPattern} from '../../rules';import {ScanPickerComponent} from '../../selectors/scan-picker/scan-picker.component';import * as M from '../../models';
@Component({selector:'tc-rfid-tag-editor',imports:[ReactiveFormsModule,Feedback,ScanPickerComponent],templateUrl:'./tag.component.html',styleUrl:'./tag.component.scss'})
export class TagComponent extends RfidEditor {
 readonly capability='RFID_TAG_MANAGE';override readonly globalOperation=true;
 readonly form=this.fb.nonNullable.group({ uuid:[crypto.randomUUID(),this.uuid],
 modelUuid:['',this.uuid],
 tid:['',[Validators.pattern(/^(?:[0-9A-Fa-f]{2}){4,64}$/)]]});
 readonly editing=!!this.data.uuid;
 ngOnInit(){if(this.data.row)this.form.patchValue(this.data.row as never);this.form.markAsPristine();}
 pick(key:string,value:string){this.form.get(key)?.setValue(value);this.form.markAsDirty();}
 async save(){await this.saveWith(()=>this.api.post('/tags',this.form.getRawValue()));}
}
