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

import {RelationshipEditorComponent} from '../../editors/relationship-editor/relationship-editor.component';

import {combineLatest} from 'rxjs';



@Component({selector:"tc-equipment-lot-detail",imports:[Feedback,RouterLink,Pagination],templateUrl:"./lot-detail.component.html",styleUrl:"./lot-detail.component.scss"})

export class LotDetailComponent extends EquipmentPage {



 readonly lot=signal<Lot|null>(null);readonly rows=signal<LotMember[]>([]);readonly offset=signal(0);readonly limit=signal(25);uuid='';

 constructor(){super();combineLatest([this.route.paramMap,this.route.queryParamMap]).pipe(takeUntilDestroyed()).subscribe(([p,q])=>{this.uuid=p.get('uuid')??'';this.offset.set(Math.max(0,Number(q.get('offset'))||0));this.limit.set(Math.min(100,Math.max(1,Number(q.get('limit'))||25)));void this.load();});}

 async load(){await this.request(async()=>({lot:await this.api.lot(this.uuid),rows:await this.api.list<LotMember>('lots/'+this.uuid+'/members',{offset:this.offset(),limit:this.limit()})}),result=>{this.lot.set(result.lot);this.rows.set(result.rows);});}

 move(offset:number){return this.router.navigate([],{relativeTo:this.route,queryParams:{offset,limit:this.limit()}});}resize(limit:number){this.limit.set(limit);void this.move(0);}

 async edit(){if(!this.session.can('EQUIPMENT_MANAGE'))return;if(await this.editor(RelationshipEditorComponent,{title:'Agregar pieza al lote',kind:'lot-add',path:'lots/'+this.uuid+'/members'}))await this.load();}

 async close(row:LotMember){if(!this.session.can('EQUIPMENT_MANAGE')||row.validTo)return;await this.action('lots/'+this.uuid+'/members/'+row.uuid+'/closure',{version:row.version},()=>this.load(),'Cerrar pertenencia');}



}

