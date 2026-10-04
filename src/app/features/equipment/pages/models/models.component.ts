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

import { CatalogEditorComponent } from '../../editors/catalog-editor/catalog-editor.component';

import { SectionNavigationComponent } from '../../components/section-navigation/section-navigation.component';



@Component({selector:"tc-equipment-models",imports:[Feedback,Pagination,RouterLink,ReactiveFormsModule,LookupComponent,SectionNavigationComponent],templateUrl:"./models.component.html",styleUrl:"./models.component.scss"})

export class ModelsComponent extends EquipmentPage {



 readonly rows=signal<Model[]>([]);readonly offset=signal(0);readonly limit=signal(25);readonly filters=new FormGroup({'categoryUuid':new FormControl('',{nonNullable:true}),'manufacturerUuid':new FormControl('',{nonNullable:true})});readonly columns=[{'key': 'code', 'label': 'Código'}, {'key': 'description', 'label': 'Descripción'}, {'key': 'categoryUuid', 'label': 'Categoría UUID'}, {'key': 'manufacturerUuid', 'label': 'OEM UUID'}, {'key': 'active', 'label': 'Activo'}];readonly modelFilters=signal<Record<string,string|number>>({});

 constructor(){super();this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params=>{const values:Record<string,string>={};for(const key of Object.keys(this.filters.controls))values[key]=params.get(key)??'';this.filters.reset(values);this.offset.set(Math.max(0,Number(params.get('offset'))||0));this.limit.set(Math.min(100,Math.max(1,Number(params.get('limit'))||25)));void this.load();});}

 async load(){await this.request(()=>this.api.list<Model>('models',{...this.query(),offset:this.offset(),limit:this.limit()}),rows=>this.rows.set(rows));}

 query(){const result:Record<string,string|number>={};for(const [key,value] of Object.entries(this.filters.getRawValue()))if(value)result[key]=value as string;return result;}

 apply(offset=0){return this.router.navigate([],{relativeTo:this.route,queryParams:{...this.query(),offset,limit:this.limit()}});}

 resize(limit:number){this.limit.set(limit);void this.apply(0);}

 value(row:Model,key:string){const value=(row as unknown as Record<string,unknown>)[key];return typeof value==='boolean'?(value?'Sí':'No'):key==='registeredAt'?this.date(value as string):value==null?'Sin dato':label(String(value));}

 async edit(row?:Model){if(!this.session.can('EQUIPMENT_MANAGE'))return;const result=await this.editor(CatalogEditorComponent,{title:row?'Editar registro':'Nuevo modelo',path:'models',kind:'models',row,reload:row?()=>this.api.model(row.uuid):undefined});if(result&&this.alive&&this.session.valid()){this.success.set('Registro guardado.');await this.load();}}

 



}

