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

import {AssetSection} from '../../asset-section';

import {RelationshipEditorComponent} from '../../editors/relationship-editor/relationship-editor.component';

import { LookupComponent } from '../../components/lookup/lookup.component';



@Component({selector:"tc-equipment-asset-lots",imports:[Feedback,Pagination,RouterLink,ReactiveFormsModule,LookupComponent],templateUrl:"./asset-lots.component.html",styleUrl:"./asset-lots.component.scss"})

export class AssetLotsComponent extends AssetSection<LotLink> {



 readonly kind='lot-memberships';readonly lotControl=new FormControl('',{nonNullable:true});

 async edit(){if(!this.session.can('EQUIPMENT_MANAGE')||!this.active()||!this.lotControl.value)return;await this.open(RelationshipEditorComponent,{title:'Agregar pieza al lote',kind:'asset-lot-add',path:'lots/'+this.lotControl.value+'/members',asset:this.store.uuid});}

 async close(row:LotLink){if(!this.session.can('EQUIPMENT_MANAGE')||row.validTo)return;await this.action('lots/'+row.lotUuid+'/members/'+row.uuid+'/closure',{version:row.version},()=>this.load(),'Cerrar pertenencia al lote');}



}

