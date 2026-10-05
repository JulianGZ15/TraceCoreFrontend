import {Directive,inject} from '@angular/core';import {FormBuilder,FormGroup,Validators} from '@angular/forms';import {RfidPage} from './page-base';import {RfidPending} from './pending';import {toInstant,uuidPattern} from './rules';
@Directive()export abstract class RfidForm extends RfidPage {
 readonly fb=inject(FormBuilder);readonly pending=inject(RfidPending);readonly uuid=[Validators.required,Validators.pattern(uuidPattern)];abstract readonly form:FormGroup;
 pick(key:string,value:string){this.form.get(key)?.setValue(value);this.form.markAsDirty();}
 validForm(){this.form.markAllAsTouched();if(this.form.invalid){this.error.set('Revisa los campos obligatorios y sus formatos.');return false;}return true;}
 expires(){const value=this.form.get('expiresAt')?.value,offset=this.form.get('utcOffset')?.value;const instant=toInstant(value+offset);const delta=Date.parse(instant)-Date.now();if(delta<=0||delta>3600000)throw new Error('El vencimiento debe ser futuro y estar dentro de una hora.');return instant;}
 async cancel(){if(!this.form.dirty||await this.discard()){this.form.markAsPristine();await this.router.navigate(['/rfid']);}}
 protected override clear(){this.form?.reset();}
}
