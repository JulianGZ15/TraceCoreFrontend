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





@Component({selector:"tc-equipment-lookup",providers:[{provide:NG_VALUE_ACCESSOR,useExisting:forwardRef(()=>LookupComponent),multi:true}],imports:[FormsModule,Feedback,Pagination],templateUrl:"./lookup.component.html",styleUrl:"./lookup.component.scss"})

export class LookupComponent {



 readonly api=inject(EquipmentApi);readonly session=inject(Session);

 readonly kind=input.required<LookupKind>();readonly label=input.required<string>();readonly filters=input<Record<string,string|number>>({});readonly purpose=input<Purpose>('MANUFACTURER');readonly picked=output<LookupItem|null>();

 readonly rows=signal<LookupItem[]>([]);readonly busy=signal(false);readonly error=signal('');readonly offset=signal(0);readonly limit=signal(25);readonly selected=signal('');readonly totalPage=signal(0);

 search='';disabled=false;private generation=0;private alive=true;private change:(value:string)=>void=()=>{};touch:()=>void=()=>{};

 readonly id='equipment-lookup-'+crypto.randomUUID();

 ngOnChanges(){void this.load(0);}

 writeValue(value:string|null){this.selected.set(value??'');}registerOnChange(fn:(value:string)=>void){this.change=fn;}registerOnTouched(fn:()=>void){this.touch=fn;}setDisabledState(value:boolean){this.disabled=value;}

 name(row:LookupItem){if('legalName' in row)return row.legalName+(row.tradeName?' · '+row.tradeName:'');if('internalCode' in row)return row.internalCode;if('revision' in row)return row.revision+' · '+label(row.state);if('heatNumber' in row)return row.heatNumber;return row.code+('name' in row?' · '+row.name:'description' in row?' · '+row.description:'');}

 outside(){return !!this.selected()&&!this.rows().some(r=>r.uuid===this.selected());}

 unavailable(row:LookupItem){return 'active' in row&&!row.active||'approved' in row&&!row.approved||'lifecycle' in row&&row.lifecycle!=='REGISTERED'||'state' in row&&row.state!=='APPROVED';}

 choose(event:Event){const value=(event.target as HTMLSelectElement).value;this.selected.set(value);this.change(value);this.touch();this.picked.emit(this.rows().find(r=>r.uuid===value)??null);}

 async load(offset=this.offset()){const gen=++this.generation,epoch=this.session.epoch();if(this.kind()==='sheet'&&!this.filters()['modelUuid']){this.rows.set([]);this.totalPage.set(0);return;}this.busy.set(true);this.error.set('');try{const query:Record<string,string|number>={...this.filters(),offset,limit:this.limit()};if(this.kind()==='party'){query['purpose']=this.purpose();if(this.search.trim())query['search']=this.search.trim();}if(this.kind()==='asset'&&this.search.trim())query['search']=this.search.trim();const rows=await this.api.lookup(this.kind(),query);if(this.alive&&gen===this.generation&&epoch===this.session.epoch()){this.rows.set(rows);this.offset.set(offset);this.totalPage.set(rows.length);}}catch(e){if(this.alive&&gen===this.generation)this.error.set(localError(e)||errorMessage(e));}finally{if(this.alive&&gen===this.generation)this.busy.set(false);}}

 resize(limit:number){this.limit.set(limit);void this.load(0);}ngOnDestroy(){this.alive=false;++this.generation;this.rows.set([]);this.selected.set('');}



}

