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

import { LookupComponent } from '../../components/lookup/lookup.component';



@Component({selector:"tc-equipment-history-editor",imports:[ReactiveFormsModule,Feedback,LookupComponent],templateUrl:"./history-editor.component.html",styleUrl:"./history-editor.component.scss",host:{"(keydown.escape)":"escape($event)"}})

export class HistoryEditorComponent extends EquipmentEditor {



 readonly conditions=conditions;readonly label=label;

 readonly form=new FormGroup({ownerType:new FormControl('COMPANY',{nonNullable:true}),partyUuid:new FormControl('',{nonNullable:true}),titleReference:new FormControl('',{nonNullable:true}),condition:new FormControl('UNKNOWN',{nonNullable:true}),reason:new FormControl('',{nonNullable:true}),sourceReference:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(500)]}),periodFrom:new FormControl('',{nonNullable:true}),periodTo:new FormControl('',{nonNullable:true}),offset:new FormControl('+00:00',{nonNullable:true}),counterFrom:new FormControl('',{nonNullable:true,validators:[decimalValidator()]}),counterTo:new FormControl('',{nonNullable:true,validators:[decimalValidator()]})});

 constructor(){super();const required=this.data.kind==='owner'?['titleReference','reason']:this.data.kind==='condition'?['reason']:['periodFrom','periodTo','counterFrom','counterTo','sourceReference',...(this.data.kind==='usage-correction'?['reason']:[])];for(const key of required)this.form.get(key)!.addValidators([Validators.required,Validators.maxLength(500)]);for(const c of Object.values(this.form.controls))c.updateValueAndValidity();this.form.updateValueAndValidity();if(this.data.row)this.reset(this.data.row);}

 override reset(row:Ref){if(this.data.kind.startsWith('usage')){const u=row as Usage;try{this.form.patchValue({periodFrom:instantInput(u.periodFrom),periodTo:instantInput(u.periodTo),counterFrom:exact(u.counterFromExact),counterTo:exact(u.counterToExact),sourceReference:u.sourceReference,offset:'+00:00',reason:''});}catch(e){this.error.set(localError(e));this.form.disable();}}else if(this.data.kind==='condition')this.form.patchValue({condition:(row as Condition).condition,reason:'',sourceReference:''});else this.form.patchValue({ownerType:'COMPANY',partyUuid:'',titleReference:'',reason:''});}

 instant(key:'periodFrom'|'periodTo'){const old=this.data.kind==='usage-correction'?(this.data.row as Usage)[key]:null,local=this.form.controls[key].value;return old&&local===instantInput(old)&&this.form.controls.offset.value==='+00:00'?old:toInstant(local,this.form.controls.offset.value);}

 save(){const v=this.form.getRawValue();if(this.data.kind==='owner'){if(!this.session.can('OWNERSHIP_MANAGE'))throw new Error('No tienes permiso para transferir propiedad.');if(v.ownerType==='PARTY'&&!v.partyUuid)throw new Error('Selecciona un tercero propietario.');return this.api.create(this.data.path,{companyUuid:v.ownerType==='COMPANY'?this.session.context()!.company.uuid:null,partyUuid:v.ownerType==='PARTY'?v.partyUuid:null,titleReference:v.titleReference,reason:v.reason,currentOwnerUuid:this.data.row!.uuid,version:this.data.row!.version});}

 if(!this.session.can('EQUIPMENT_MANAGE'))throw new Error('No tienes permiso de mantenimiento.');if(this.data.kind==='condition')return this.api.create(this.data.path,{condition:v.condition,reason:v.reason,sourceReference:v.sourceReference||null,currentConditionUuid:this.data.row!.uuid,version:this.data.row!.version});

 const from=this.instant('periodFrom'),to=this.instant('periodTo');if(!from||!to||Date.parse(to)<=Date.parse(from)||Date.parse(to)>Date.now()||this.data.registeredAt&&Date.parse(from)<Date.parse(this.data.registeredAt))throw new Error('Captura un periodo posterior al alta, ordenado y no futuro.');if(!decimal(v.counterFrom)||!decimal(v.counterTo)||scaled(v.counterTo)<scaled(v.counterFrom))throw new Error('Los contadores deben ser exactos, no negativos y no decrecientes.');if(this.data.kind==='usage-correction'&&(this.data.row as Usage).correctedAt)throw new Error('La lectura original ya fue corregida; consulta el historial.');const body={periodFrom:from,periodTo:to,counterFrom:v.counterFrom,counterTo:v.counterTo,sourceReference:v.sourceReference};return this.data.kind==='usage-correction'?this.api.create(this.data.path+'/'+this.data.row!.uuid+'/corrections',{...body,reason:v.reason,version:this.data.row!.version}):this.api.create(this.data.path,body);}



}

