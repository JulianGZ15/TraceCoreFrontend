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

import {AssetEditorComponent} from '../../editors/asset-editor/asset-editor.component';



@Component({selector:"tc-equipment-asset-general",imports:[Feedback,RouterLink],templateUrl:"./asset-general.component.html",styleUrl:"./asset-general.component.scss"})

export class AssetGeneralComponent extends EquipmentPage {



 readonly store=inject(AssetStore);

 async edit(kind:'correct'|'retire'){const profile=this.store.profile();if(!profile||!this.session.can('EQUIPMENT_MANAGE')||profile.asset.lifecycle!=='REGISTERED')return;if(await this.editor(AssetEditorComponent,{title:kind==='correct'?'Corregir identidad':'Retirar equipo',kind,path:'assets/'+profile.asset.uuid,row:profile.asset,reload:async()=>(await this.api.profile(profile.asset.uuid)).asset})){this.success.set('Equipo actualizado.');await this.store.load();}}



}

