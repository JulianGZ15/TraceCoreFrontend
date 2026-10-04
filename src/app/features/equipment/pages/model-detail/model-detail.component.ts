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

import { CatalogEditorComponent } from '../../editors/catalog-editor/catalog-editor.component';

import { SectionNavigationComponent } from '../../components/section-navigation/section-navigation.component';

import {combineLatest} from 'rxjs';



@Component({selector:"tc-equipment-model-detail",imports:[Feedback,RouterLink,Pagination,Status,SectionNavigationComponent],templateUrl:"./model-detail.component.html",styleUrl:"./model-detail.component.scss"})

export class ModelDetailComponent extends EquipmentPage {



 readonly model=signal<Model|null>(null);readonly sheets=signal<Sheet[]>([]);readonly offset=signal(0);readonly limit=signal(25);

 constructor(){super();combineLatest([this.route.paramMap,this.route.queryParamMap]).pipe(takeUntilDestroyed()).subscribe(([params,query])=>{this.uuid=params.get('uuid')??'';this.offset.set(Math.max(0,Number(query.get('offset'))||0));this.limit.set(Math.min(100,Math.max(1,Number(query.get('limit'))||25)));void this.load();});}

 uuid='';async load(){await this.request(async()=>({model:await this.api.model(this.uuid),sheets:await this.api.list<Sheet>('models/'+this.uuid+'/sheets',{offset:this.offset(),limit:this.limit()})}),data=>{this.model.set(data.model);this.sheets.set(data.sheets);});}

 move(offset:number){return this.router.navigate([],{relativeTo:this.route,queryParams:{offset,limit:this.limit()}});}resize(limit:number){this.limit.set(limit);void this.move(0);}

 async edit(){const row=this.model();if(!row||!this.session.can('EQUIPMENT_MANAGE'))return;if(await this.editor(CatalogEditorComponent,{title:'Editar modelo',path:'models',kind:'models',row,reload:()=>this.api.model(this.uuid)}))await this.load();}



}

