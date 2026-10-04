import { Directive,inject,signal,OnDestroy } from '@angular/core';

import { FormGroup } from '@angular/forms';

import { Dialog,DialogRef,DIALOG_DATA } from '@angular/cdk/dialog';

import { HttpErrorResponse } from '@angular/common/http';

import { Session } from '../../core/auth/session';

import { errorMessage } from '../../core/http/api';

import { confirm } from '../../shared/ui/editor';

import { EquipmentApi } from './equipment-api';

import { Ref, Assembly } from './models';

import { localError } from './rules';

export interface EditorContext {title:string;path:string;kind:string;row?:Ref;asset?:string;assemblyUuid?:string;assembly?:Assembly;registeredAt?:string;party?:string;reload?:()=>Promise<Ref>;}

@Directive()

export abstract class EquipmentEditor implements OnDestroy {

  readonly data=inject<EditorContext>(DIALOG_DATA);readonly api=inject(EquipmentApi);readonly session=inject(Session);readonly dialog=inject(Dialog);readonly ref=inject(DialogRef);

  abstract readonly form:FormGroup;readonly busy=signal(false);readonly error=signal('');readonly conflict=signal(false);protected alive=true;private epoch=this.session.epoch();

  abstract save():Promise<unknown>;

  async submit(){this.form.markAllAsTouched();if(this.form.disabled||this.form.invalid||this.busy())return;this.busy.set(true);this.error.set('');this.conflict.set(false);try{const result=await this.save();if(this.alive&&this.epoch===this.session.epoch())this.ref.close(result);}catch(e){if(this.alive&&this.epoch===this.session.epoch()){this.error.set(localError(e)||errorMessage(e));this.conflict.set(e instanceof HttpErrorResponse&&e.status===409);}}finally{if(this.alive)this.busy.set(false);}}

  reset(row:Ref){this.form.reset(row);}

  async reload(){if(!this.data.reload||this.busy()||!await confirm(this.dialog,'Recargar datos','Se descartarán los cambios de este formulario.'))return;this.busy.set(true);try{const result=await this.data.reload();if(this.alive&&this.epoch===this.session.epoch()){this.data.row=result;this.reset(result);this.form.markAsPristine();this.error.set('');this.conflict.set(false);}}catch(e){this.error.set(localError(e)||errorMessage(e));}finally{if(this.alive)this.busy.set(false);}}

  async close(){if(this.busy())return;if(!this.session.valid()||!this.form.dirty||await confirm(this.dialog,'Descartar cambios','Los cambios sin guardar se perderán.'))this.ref.close();}

  escape(event:Event){event.stopPropagation();void this.close();}

  ngOnDestroy(){this.alive=false;this.form.reset();}

}

