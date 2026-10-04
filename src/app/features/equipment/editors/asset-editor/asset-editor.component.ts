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



@Component({selector:"tc-equipment-asset-editor",imports:[ReactiveFormsModule,Feedback],templateUrl:"./asset-editor.component.html",styleUrl:"./asset-editor.component.scss",host:{"(keydown.escape)":"escape($event)"}})

export class AssetEditorComponent extends EquipmentEditor {



 readonly form=new FormGroup({internalCode:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(100)]}),serialNumber:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(100)]}),origin:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(500)]}),referenceValue:new FormControl('',{nonNullable:true,validators:[decimalValidator(15,4)]}),currency:new FormControl('',{nonNullable:true,validators:[Validators.pattern(/^[A-Za-z]{3}$/)]}),valuationReference:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(500)]}),reason:new FormControl('',{nonNullable:true})});

 constructor(){super();if(this.data.kind==='retire'){for(const key of ['internalCode','origin'])this.form.get(key)!.clearValidators();this.form.controls.reason.setValidators([Validators.required,Validators.maxLength(500)]);}this.reset(this.data.row!);}

 override reset(row:Ref){const asset=row as Asset;try{this.form.reset({internalCode:asset.internalCode,serialNumber:asset.serialNumber??'',origin:asset.origin,referenceValue:asset.referenceValueExact==null?(asset.referenceValue!=null?exact(undefined):''):exact(asset.referenceValueExact),currency:asset.currency??'',valuationReference:asset.valuationReference??'',reason:''});}catch(e){this.error.set(localError(e));this.form.disable();}}

 save(){if(!this.session.can('EQUIPMENT_MANAGE'))throw new Error('No tienes permiso.');const v=this.form.getRawValue();if(this.data.kind==='retire')return this.api.create(this.data.path+'/retirement',{reason:v.reason,version:this.data.row!.version});if(!!v.referenceValue!==!!v.currency)throw new Error('Valor y divisa deben capturarse juntos.');return this.api.update(this.data.path,{internalCode:v.internalCode.trim().toUpperCase(),serialNumber:v.serialNumber.trim().toUpperCase()||null,origin:v.origin,referenceValue:v.referenceValue||null,currency:v.currency.toUpperCase()||null,valuationReference:v.valuationReference||null,version:this.data.row!.version});}



}

