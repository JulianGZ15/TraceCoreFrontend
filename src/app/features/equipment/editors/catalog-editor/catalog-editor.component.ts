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



@Component({selector:"tc-equipment-catalog-editor",imports:[ReactiveFormsModule,LookupComponent,Feedback],templateUrl:"./catalog-editor.component.html",styleUrl:"./catalog-editor.component.scss",host:{"(keydown.escape)":"escape($event)"}})

export class CatalogEditorComponent extends EquipmentEditor {



 readonly schemas:Record<string,{key:string;label:string;type:string;required:boolean}[]>={"categories": [{"key": "code", "label": "Código", "type": "text", "required": true}, {"key": "name", "label": "Nombre", "type": "text", "required": true}, {"key": "parentUuid", "label": "Categoría padre", "type": "category", "required": false}, {"key": "technicalKind", "label": "Perfil técnico", "type": "select", "required": true}, {"key": "active", "label": "Activo", "type": "checkbox", "required": false}], "models": [{"key": "categoryUuid", "label": "Categoría", "type": "category", "required": true}, {"key": "manufacturerUuid", "label": "Fabricante OEM", "type": "party", "required": true}, {"key": "code", "label": "Código del modelo", "type": "text", "required": true}, {"key": "description", "label": "Descripción", "type": "textarea", "required": true}, {"key": "active", "label": "Activo", "type": "checkbox", "required": false}], "material-grades": [{"key": "code", "label": "Código", "type": "text", "required": true}, {"key": "name", "label": "Denominación", "type": "text", "required": true}, {"key": "standardReference", "label": "Referencia de especificación", "type": "text", "required": true}, {"key": "baseMaterial", "label": "Material base", "type": "text", "required": true}], "heats": [{"key": "millUuid", "label": "Molino / fundidor", "type": "party", "required": true}, {"key": "gradeUuid", "label": "Grado aprobado", "type": "grade", "required": true}, {"key": "heatNumber", "label": "Número de colada", "type": "text", "required": true}, {"key": "manufacturedOn", "label": "Fecha de fabricación", "type": "date", "required": false}, {"key": "provenance", "label": "Procedencia", "type": "textarea", "required": true}], "lots": [{"key": "code", "label": "Código", "type": "text", "required": true}, {"key": "type", "label": "Tipo de lote", "type": "select", "required": true}, {"key": "origin", "label": "Origen", "type": "textarea", "required": true}, {"key": "description", "label": "Descripción", "type": "textarea", "required": true}]};

 readonly fields=this.schemas[this.data.kind];readonly form=new FormGroup<Record<string,FormControl>>({});

 readonly options=(key:string)=>key==='technicalKind'?technicalKinds:['PROCUREMENT','ADMINISTRATIVE'];readonly label=label;

 constructor(){super();this.reset(this.data.row??{uuid:'',version:0});}

 override reset(row:Ref){const data=row as unknown as Record<string,unknown>;for(const field of this.fields){const initial=data[field.key]??(field.key==='active'?true:field.key==='technicalKind'?'GENERAL':field.key==='type'?'PROCUREMENT':'');const validators=field.required?[Validators.required]:[];if(field.type==='text'||field.type==='textarea')validators.push(Validators.maxLength(field.key==='description'?1000:field.type==='textarea'?500:field.key==='name'?150:field.key==='code'?80:100));if(!this.form.get(field.key))this.form.addControl(field.key,new FormControl(initial,validators));else this.form.get(field.key)!.reset(initial);if(this.data.row&&(field.key==='technicalKind'||this.data.kind==='models'&&['code','categoryUuid','manufacturerUuid'].includes(field.key)))this.form.get(field.key)!.disable();}}

 save(){if(!this.session.can('EQUIPMENT_MANAGE'))throw new Error('No tienes permiso de mantenimiento.');const values=this.form.getRawValue();if(values['manufacturedOn']&&!calendarValid(values['manufacturedOn']))throw new Error('La fecha de fabricación no existe.');for(const field of this.fields){if(values[field.key]==='')values[field.key]=null;}return this.data.row?this.api.update(this.data.path+'/'+this.data.row.uuid,{...values,version:this.data.row.version}):this.api.create(this.data.path,values);}



}

