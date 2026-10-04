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

import {HistoryEditorComponent} from '../../editors/history-editor/history-editor.component';



@Component({selector:"tc-equipment-ownership",imports:[Feedback,Pagination],templateUrl:"./ownership.component.html",styleUrl:"./ownership.component.scss"})

export class OwnershipComponent extends AssetSection<Owner> {



 readonly kind='owners';

 async edit(){const owner=this.store.profile()?.owner;if(!owner||!this.session.can('OWNERSHIP_MANAGE')||!this.active())return;await this.open(HistoryEditorComponent,{title:'Transferir propiedad',kind:'owner',path:'assets/'+this.store.uuid+'/owners',row:owner,reload:async()=>(await this.api.profile(this.store.uuid)).owner});}



}

