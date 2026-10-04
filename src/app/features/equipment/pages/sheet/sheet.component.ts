import { confirm } from '../../../../shared/ui/editor';

import { Component, inject, signal, input, output, computed, OnInit, OnDestroy, OnChanges, SimpleChanges, forwardRef } from '@angular/core';

import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HttpErrorResponse } from '@angular/common/http';

import { Feedback, Pagination, PageHeading, Status } from '../../../../shared/ui/page';

import { EquipmentApi } from '../../equipment-api';

import { EquipmentPage, EquipmentFormPage } from '../../page-base';

import { EquipmentEditor } from '../../editor-base';

import { AssetStore } from '../../asset-store';

import { Session } from '../../../../core/auth/session';

import { Ref, Category, Model, Sheet, Asset, Profile, Grade, Heat, Trace, Lot, LotMember, LotLink, Owner, Condition, Assembly, ComponentMember, AssemblyLink, Usage, LookupItem, LookupKind, Purpose, Specs, Quantity, technicalKinds, conditions, quantities, catalogLinks, assetSections } from '../../models';

import { label, localError, numberText, quantityText, decimal, decimalValidator, scaled, exact, specsForm, readSpecs, writeSpecs, approvalMissing, toInstant, instantInput, units, uuidPattern, calendarValid } from '../../rules';

import { errorMessage } from '../../../../core/http/api';

import { SpecificationsComponent } from '../../components/specifications/specifications.component';



@Component({selector:"tc-equipment-sheet",imports:[Feedback,RouterLink,ReactiveFormsModule,SpecificationsComponent],templateUrl:"./sheet.component.html",styleUrl:"./sheet.component.scss"})

export class SheetComponent extends EquipmentFormPage {



 readonly form=new FormGroup({revision:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(100)]}),validFrom:new FormControl('',{nonNullable:true}),validTo:new FormControl('',{nonNullable:true}),offset:new FormControl('+00:00',{nonNullable:true}),documentReference:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(500)]}),specs:specsForm()});

 readonly sheet=signal<Sheet|null>(null);readonly model=signal<Model|null>(null);readonly category=signal<Category|null>(null);uuid='';isNew=false;

 constructor(){super();this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(p=>{this.isNew=!!p.get('modelUuid');this.uuid=p.get(this.isNew?'modelUuid':'uuid')??'';this.sheet.set(null);void this.load();});}

 async load(){this.incompatible.set(false);await this.request(async()=>{const sheet=this.isNew?null:await this.api.sheet(this.uuid);const model=await this.api.model(sheet?.modelUuid??this.uuid);return {sheet,model,category:await this.api.category(model.categoryUuid)};},data=>{this.sheet.set(data.sheet);this.model.set(data.model);this.category.set(data.category);if(data.sheet){this.form.reset({revision:data.sheet.revision,validFrom:instantInput(data.sheet.validFrom),validTo:instantInput(data.sheet.validTo),offset:'+00:00',documentReference:data.sheet.documentReference??''});try{readSpecs(this.form.controls.specs,data.sheet.specs);}catch(e){this.incompatible.set(true);this.error.set(localError(e));}}if(this.isNew||data.sheet?.state==='DRAFT'){this.form.enable();if(!this.session.can('EQUIPMENT_MANAGE'))this.form.disable();}else this.form.disable();this.form.markAsPristine();});}

 async reload(){if(await confirm(this.dialog,'Recargar ficha','Se descartarán los cambios del formulario.')){this.conflict.set(false);await this.load();}}

 instant(key:'validFrom'|'validTo'){const value=this.form.controls[key].value,old=this.sheet()?.[key];return old&&value===instantInput(old)&&this.form.controls.offset.value==='+00:00'?old:toInstant(value,this.form.controls.offset.value);}

 async save(){this.form.markAllAsTouched();if(this.form.invalid||this.busy()||this.incompatible()||(!this.isNew&&this.sheet()?.state!=='DRAFT')||!this.session.can('EQUIPMENT_MANAGE'))return;let from:string|null,to:string|null;try{from=this.instant('validFrom');to=this.instant('validTo');}catch(e){this.error.set(localError(e));return;}if(to&&Date.parse(to)<=Date.parse(from??new Date().toISOString())){this.error.set('El fin exclusivo debe ser posterior al inicio.');return;}const body={revision:this.form.controls.revision.value,validFrom:from,validTo:to,specs:writeSpecs(this.form.controls.specs),documentReference:this.form.controls.documentReference.value||null};this.conflict.set(false);await this.request(()=>this.isNew?this.api.create<Sheet>('models/'+this.uuid+'/sheets',body):this.api.update<Sheet>('sheets/'+this.uuid,{...body,version:this.sheet()!.version}),result=>{this.form.markAsPristine();this.success.set('Ficha guardada.');void this.router.navigate(['/catalogo/fichas',result.uuid]);if(!this.isNew)this.sheet.set(result);});this.conflict.set(!!this.error()&&!this.isNew);}

 async transition(action:'approval'|'retirement'){const sheet=this.sheet();if(!sheet||!this.session.can('TECHNICAL_APPROVE')||this.incompatible())return;if(this.form.dirty){this.error.set('Guarda o recarga el borrador antes de cambiar su estado.');return;}await this.action('sheets/'+sheet.uuid+'/'+action,{version:sheet.version},()=>this.load(),action==='approval'?'Aprobar ficha':'Retirar ficha');}



}

