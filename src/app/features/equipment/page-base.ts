import { Directive,inject,signal,OnDestroy } from '@angular/core';

import { ActivatedRoute,Router,CanDeactivateFn } from '@angular/router';

import { FormGroup } from '@angular/forms';

import { Dialog } from '@angular/cdk/dialog';

import { firstValueFrom } from 'rxjs';

import { Session } from '../../core/auth/session';

import { errorMessage } from '../../core/http/api';

import { confirm } from '../../shared/ui/editor';

import { EquipmentApi } from './equipment-api';

import { localError, label,numberText,prettyDate } from './rules';

@Directive()

export abstract class EquipmentPage implements OnDestroy {

  readonly api=inject(EquipmentApi);readonly session=inject(Session);readonly dialog=inject(Dialog);readonly route=inject(ActivatedRoute);readonly router=inject(Router);

  readonly busy=signal(false);readonly error=signal('');readonly success=signal('');readonly label=label;readonly numberText=numberText;

  protected alive=true;protected generation=0;

  date(value:string|null){return prettyDate(value,this.session.context()?.company.timezone??'UTC');}

  protected async request<T>(operation:()=>Promise<T>, apply:(value:T)=>void){const gen=++this.generation,epoch=this.session.epoch();this.busy.set(true);this.error.set('');try{const result=await operation();if(this.alive&&gen===this.generation&&epoch===this.session.epoch())apply(result);}catch(e){if(this.alive&&gen===this.generation&&epoch===this.session.epoch())this.error.set(localError(e)||errorMessage(e));}finally{if(this.alive&&gen===this.generation)this.busy.set(false);}}

  async editor<C>(component:import('@angular/core').Type<C>,data:unknown){return firstValueFrom(this.dialog.open(component,{data,width:'760px',maxWidth:'calc(100vw - 32px)',disableClose:true,ariaLabel:'Formulario técnico'}).closed);}

  async action(path:string,body:unknown,refresh:()=>Promise<void>,title:string){if(this.busy()||!await confirm(this.dialog,title,'La operación conservará el historial.'))return;await this.request(()=>this.api.create(path,body),()=>this.success.set('Acción confirmada.'));if(!this.error()&&this.alive&&this.session.valid())await refresh();}

  ngOnDestroy(){this.alive=false;++this.generation;}

}

@Directive()

export abstract class EquipmentFormPage extends EquipmentPage {

  abstract readonly form:FormGroup;readonly conflict=signal(false);readonly incompatible=signal(false);

  async canLeave(){return !this.session.valid()||!this.form.dirty||await confirm(this.dialog,'Descartar cambios','Los cambios sin guardar se perderán.');}

  override ngOnDestroy(){super.ngOnDestroy();this.form.reset();}

}

export const equipmentDraftGuard:CanDeactivateFn<EquipmentFormPage>=component=>component.canLeave();

