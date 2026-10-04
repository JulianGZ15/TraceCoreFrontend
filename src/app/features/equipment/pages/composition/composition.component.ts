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



@Component({selector:"tc-equipment-composition",imports:[Feedback,RouterLink,Pagination],templateUrl:"./composition.component.html",styleUrl:"./composition.component.scss"})

export class CompositionComponent extends EquipmentPage {



 readonly store=inject(AssetStore);readonly assembly=signal<Assembly|null>(null);readonly components=signal<ComponentMember[]>([]);readonly parents=signal<AssemblyLink[]>([]);readonly componentOffset=signal(0);readonly parentOffset=signal(0);readonly limit=signal(25);

 constructor(){super();this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(q=>{this.componentOffset.set(Math.max(0,Number(q.get('componentOffset'))||0));this.parentOffset.set(Math.max(0,Number(q.get('parentOffset'))||0));this.limit.set(Math.min(100,Math.max(1,Number(q.get('limit'))||25)));void this.load();});}

 async load(){await this.request(async()=>{const [assembly,parents]=await Promise.all([this.api.ownAssembly(this.store.uuid),this.api.list<AssemblyLink>('assets/'+this.store.uuid+'/assembly-memberships',{offset:this.parentOffset(),limit:this.limit()})]);const components=assembly?await this.api.list<ComponentMember>('assemblies/'+assembly.uuid+'/components',{offset:this.componentOffset(),limit:this.limit()}):[];return {assembly,parents,components};},result=>{this.assembly.set(result.assembly);this.parents.set(result.parents);this.components.set(result.components);});}

 move(offset:number,parent=false){return this.router.navigate([],{relativeTo:this.route,queryParams:{componentOffset:parent?this.componentOffset():offset,parentOffset:parent?offset:this.parentOffset(),limit:this.limit()}});}resize(limit:number){this.limit.set(limit);return this.router.navigate([],{relativeTo:this.route,queryParams:{componentOffset:0,parentOffset:0,limit}});}

 active(){return this.store.profile()?.asset.lifecycle==='REGISTERED';}

 async edit(kind:string,row?:ComponentMember){if(!this.session.can('EQUIPMENT_MANAGE'))return;if(kind!=='component-remove'&&!this.active())return;try{const assembly=row?await this.api.assembly(row.assemblyUuid):this.assembly();const data:import('../../editor-base').EditorContext={title:kind==='assembly-new'?'Definir conjunto':kind==='component-add'?'Agregar componente':'Desmontar componente',kind,path:assembly?'assemblies/'+assembly.uuid+'/components':'assemblies',asset:this.store.uuid,row,assembly:assembly??undefined};if(assembly)data.reload=async()=>{data.assembly=await this.api.assembly(assembly.uuid);return row?this.api.find<ComponentMember>('assemblies/'+assembly.uuid+'/components',row.uuid):data.assembly;};if(await this.editor(RelationshipEditorComponent,data)){if(this.alive&&this.session.valid()){this.success.set('Composición actualizada.');await this.load();}}}catch(e){this.error.set(localError(e)||errorMessage(e));}}



}

