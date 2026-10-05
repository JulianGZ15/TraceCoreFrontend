import { Directive,inject,output } from '@angular/core';
import { DIALOG_DATA,DialogRef } from '@angular/cdk/dialog';
import { FormBuilder,FormGroup,Validators } from '@angular/forms';
import { RfidPage } from './page-base';
import { uuidPattern } from './rules';
@Directive()
export abstract class RfidEditor extends RfidPage {
 readonly data=inject<{row?:unknown;version?:number;uuid?:string;yardUuid?:string;assetUuid?:string;expectedAssignmentUuid?:string|null;path?:string}>(DIALOG_DATA,{optional:true})??{};
 readonly ref=inject(DialogRef,{optional:true});readonly fb=inject(FormBuilder);readonly saved=output<unknown>();
 readonly required=Validators.required;readonly uuid=[Validators.required,Validators.pattern(uuidPattern)];
 abstract readonly form:FormGroup;abstract readonly capability:string;readonly globalOperation:boolean=true;
 canWrite(){return this.globalOperation?this.access.global(this.capability):this.access.can(this.capability,this.data.yardUuid);}
 async saveWith<T>(save:()=>Promise<T>){this.form.markAllAsTouched();if(this.form.invalid){this.error.set('Revisa los campos obligatorios y su formato.');return;}if(!this.canWrite()){this.error.set('No tienes permiso para esta operación.');return;}
  await this.mutate(save,r=>{this.form.markAsPristine();this.saved.emit(r);this.ref?.close(r);});
 }
 async cancel(){if(!this.form.dirty||await this.discard()){this.form.markAsPristine();this.ref?.close();}}
 protected override clear(){this.form?.reset();}
}
