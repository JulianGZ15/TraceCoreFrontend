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



@Component({selector:"tc-equipment-usage",imports:[Feedback,Pagination],templateUrl:"./usage.component.html",styleUrl:"./usage.component.scss"})

export class UsageComponent extends AssetSection<Usage> {



 readonly kind='usage';

 async edit(row?:Usage){if(!this.session.can('EQUIPMENT_MANAGE')||row?.correctedAt||!row&&!this.active())return;await this.open(HistoryEditorComponent,{title:row?'Corregir lectura':'Registrar lectura de horas',kind:row?'usage-correction':'usage',path:'assets/'+this.store.uuid+'/usage',row,registeredAt:this.store.profile()!.asset.registeredAt,reload:row?()=>this.api.find<Usage>('assets/'+this.store.uuid+'/usage',row.uuid):undefined});}



}

