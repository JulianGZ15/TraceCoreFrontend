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



@Component({selector:"tc-equipment-quota-target-editor",imports:[ReactiveFormsModule,Feedback,LookupComponent],templateUrl:"./quota-target-editor.component.html",styleUrl:"./quota-target-editor.component.scss",host:{"(keydown.escape)":"escape($event)"}})

export class QuotaTargetEditorComponent extends EquipmentEditor {



 readonly form=new FormGroup({target:new FormControl('CATEGORY',{nonNullable:true}),categoryUuid:new FormControl('',{nonNullable:true}),modelUuid:new FormControl('',{nonNullable:true})});readonly modelFilters=signal<Record<string,string|number>>({});

 categoryChanged(row:LookupItem|null){this.form.controls.modelUuid.reset('');this.modelFilters.set(row?{categoryUuid:row.uuid}:{});}

 override reset(_row:Ref){this.form.reset({target:'CATEGORY',categoryUuid:'',modelUuid:''});this.modelFilters.set({});}

 save(){if(!this.session.can('PARTY_APPROVE')||!this.session.can('EQUIPMENT_READ'))throw new Error('Faltan capacidades para vincular la cuota.');const v=this.form.getRawValue(),category=v.target==='CATEGORY'?v.categoryUuid:null,model=v.target==='MODEL'?v.modelUuid:null;if(!category&&!model)throw new Error('Selecciona una categoría o un modelo.');return this.api.bindQuota(this.data.party!,this.data.row!.uuid,{categoryUuid:category,modelUuid:model,version:this.data.row!.version});}



}

