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

import { SpecificationsComponent } from '../../components/specifications/specifications.component';



@Component({selector:"tc-equipment-registration",imports:[Feedback,RouterLink,ReactiveFormsModule,LookupComponent,SpecificationsComponent],templateUrl:"./registration.component.html",styleUrl:"./registration.component.scss"})

export class RegistrationComponent extends EquipmentFormPage {



 readonly form=new FormGroup({categoryUuid:new FormControl('',{nonNullable:true,validators:[Validators.required]}),modelUuid:new FormControl('',{nonNullable:true,validators:[Validators.required]}),sheetUuid:new FormControl('',{nonNullable:true,validators:[Validators.required]}),internalCode:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(100)]}),serialNumber:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(100)]}),origin:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(500)]}),registeredAt:new FormControl('',{nonNullable:true}),offset:new FormControl('+00:00',{nonNullable:true}),ownerType:new FormControl('COMPANY',{nonNullable:true}),partyUuid:new FormControl('',{nonNullable:true}),titleReference:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(500)]}),ownerReason:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(500)]}),condition:new FormControl('UNKNOWN',{nonNullable:true}),conditionReason:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(500)]}),referenceValue:new FormControl('',{nonNullable:true,validators:[decimalValidator(15,4)]}),currency:new FormControl('',{nonNullable:true,validators:[Validators.pattern(/^[A-Za-z]{3}$/)]}),valuationReference:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(500)]})});

 readonly step=signal(0);readonly steps=['Selección técnica','Identidad','Propiedad y condición','Revisión'];readonly sheet=signal<Sheet|null>(null);readonly category=signal<Category|null>(null);readonly model=signal<Model|null>(null);readonly ownerLabel=signal('');readonly modelFilters=signal<Record<string,string|number>>({});readonly sheetFilters=signal<Record<string,string|number>>({});readonly conditions=conditions;

 categoryChanged(item:LookupItem|null){this.category.set(item as Category|null);this.model.set(null);this.sheet.set(null);this.form.controls.modelUuid.reset('');this.form.controls.sheetUuid.reset('');this.modelFilters.set(item?{categoryUuid:item.uuid}:{});this.sheetFilters.set({});}

 modelChanged(item:LookupItem|null){this.model.set(item as Model|null);this.sheet.set(null);this.form.controls.sheetUuid.reset('');this.sheetFilters.set(item?{modelUuid:item.uuid}:{});}

 sheetChanged(item:LookupItem|null){this.sheet.set(item as Sheet|null);this.incompatible.set(false);if(item){try{readSpecs(specsForm(),(item as Sheet).specs);}catch(e){this.incompatible.set(true);this.error.set(localError(e));}}}

 ownerChanged(item:LookupItem|null){this.ownerLabel.set(item&&'legalName' in item?item.legalName:'');}

 next(){const keys=this.step()===0?['categoryUuid','modelUuid','sheetUuid']:this.step()===1?['internalCode','serialNumber','origin']:['titleReference','ownerReason','condition','conditionReason','referenceValue','currency'];for(const key of keys)this.form.get(key)!.markAsTouched();if(keys.some(key=>this.form.get(key)!.invalid)||this.incompatible()){this.error.set(this.incompatible()?'Backend incompatible: faltan magnitudes exactas.':'Revisa los campos del paso actual.');return;}if(this.step()===0&&this.sheet()?.state!=='APPROVED'){this.error.set('Selecciona una ficha aprobada.');return;}if(this.step()===2&&this.form.controls.ownerType.value==='PARTY'&&!this.form.controls.partyUuid.value){this.error.set('Selecciona el tercero propietario.');return;}this.error.set('');this.step.update(s=>Math.min(3,s+1));}

 async save(){if(this.step()<3){this.next();return;}this.form.markAllAsTouched();if(this.form.invalid||this.busy()||this.incompatible()||!this.session.can('EQUIPMENT_MANAGE')||!this.session.can('OWNERSHIP_MANAGE'))return;try{const v=this.form.getRawValue(),registered=toInstant(v.registeredAt,v.offset),effective=registered??new Date().toISOString(),sheet=this.sheet();if(!sheet||sheet.state!=='APPROVED'||Date.parse(effective)<Date.parse(sheet.validFrom)||sheet.validTo&&Date.parse(effective)>=Date.parse(sheet.validTo))throw new Error('La ficha aprobada debe cubrir la fecha de alta.');if(registered&&Date.parse(registered)>Date.now())throw new Error('La fecha de alta no puede ser futura.');if(!!v.referenceValue!==!!v.currency)throw new Error('Captura valor y divisa juntos.');if(v.ownerType==='PARTY'&&!v.partyUuid)throw new Error('Selecciona un tercero propietario.');const owner={companyUuid:v.ownerType==='COMPANY'?this.session.context()!.company.uuid:null,partyUuid:v.ownerType==='PARTY'?v.partyUuid:null,titleReference:v.titleReference,reason:v.ownerReason};await this.request(()=>this.api.create<Asset>('assets',{sheetUuid:v.sheetUuid,internalCode:v.internalCode.trim().toUpperCase(),serialNumber:v.serialNumber.trim().toUpperCase()||null,origin:v.origin,registeredAt:registered,owner,condition:v.condition,conditionReason:v.conditionReason,referenceValue:v.referenceValue||null,currency:v.currency.toUpperCase()||null,valuationReference:v.valuationReference||null}),asset=>{this.form.markAsPristine();void this.router.navigate(['/equipos',asset.uuid,'general']);});}catch(e){this.error.set(localError(e)||errorMessage(e));}}



}

