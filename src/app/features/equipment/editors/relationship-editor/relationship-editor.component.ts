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



@Component({selector:"tc-equipment-relationship-editor",imports:[ReactiveFormsModule,Feedback,LookupComponent],templateUrl:"./relationship-editor.component.html",styleUrl:"./relationship-editor.component.scss",host:{"(keydown.escape)":"escape($event)"}})

export class RelationshipEditorComponent extends EquipmentEditor {



 readonly form=new FormGroup({assetUuid:new FormControl('',{nonNullable:true}),heatUuid:new FormControl('',{nonNullable:true}),position:new FormControl('',{nonNullable:true}),reason:new FormControl('',{nonNullable:true}),type:new FormControl('',{nonNullable:true}),cladding:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(250)]}),coatingValue:new FormControl('',{nonNullable:true,validators:[decimalValidator(12,6,true)]}),coatingUnit:new FormControl('',{nonNullable:true}),documentReference:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(500)]})});readonly assetFilters={lifecycle:'REGISTERED'};readonly lengthUnits=units['LENGTH'];

 constructor(){super();const required=this.data.kind==='material'?['heatUuid','position']:this.data.kind==='assembly-new'?['type']:this.data.kind==='component-add'?['assetUuid','position','reason']:['component-remove','asset-lot-add'].includes(this.data.kind)?['reason']:['assetUuid','reason'];for(const key of required)this.form.get(key)!.addValidators([Validators.required,Validators.maxLength(key==='reason'?500:100)]);for(const c of Object.values(this.form.controls))c.updateValueAndValidity();this.form.updateValueAndValidity();}

 override reset(_row:Ref){this.form.reset({assetUuid:'',heatUuid:'',position:'',reason:'',type:'',cladding:'',coatingValue:'',coatingUnit:'',documentReference:''});}

 save(){if(!this.session.can('EQUIPMENT_MANAGE'))throw new Error('No tienes permiso de mantenimiento.');const v=this.form.getRawValue();if(this.data.kind==='material'){if(!!v.coatingValue!==!!v.coatingUnit||v.coatingValue&&!v.cladding||v.coatingUnit&&!this.lengthUnits.includes(v.coatingUnit as typeof this.lengthUnits[number]))throw new Error('El espesor exige material y una unidad de longitud compatible.');return this.api.create(this.data.path,{position:v.position,heatUuid:v.heatUuid,cladding:v.cladding||null,coatingThickness:v.coatingValue?{value:v.coatingValue,unit:v.coatingUnit}:null,documentReference:v.documentReference||null});}if(this.data.kind==='assembly-new')return this.api.create('assemblies',{parentAssetUuid:this.data.asset,type:v.type});if(this.data.kind==='component-add')return this.api.create(this.data.path,{assetUuid:v.assetUuid,position:v.position,reason:v.reason,assemblyVersion:this.data.assembly!.version});if(this.data.kind==='component-remove')return this.api.create(this.data.path+'/'+this.data.row!.uuid+'/closure',{reason:v.reason,version:this.data.row!.version,assemblyVersion:this.data.assembly!.version});return this.api.create(this.data.path,{assetUuid:this.data.kind==='asset-lot-add'?this.data.asset:v.assetUuid,reason:v.reason});}



}

