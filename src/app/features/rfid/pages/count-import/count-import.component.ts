import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';
import {inject} from '@angular/core';import {FormArray} from '@angular/forms';import {RfidForm} from '../../form-base';import {RfidSelection} from '../../selection';import {ScanPickerComponent} from '../../selectors/scan-picker/scan-picker.component';import {confirm} from '../../../../shared/ui/editor';
interface Preview {eventUuid:string;expectedItemUuid:string|null;version:number|null;observed:boolean;locationUuid:string|null;}
@Component({selector:'tc-rfid-count-import',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent,ReactiveFormsModule,ScanPickerComponent],templateUrl:'./count-import.component.html',styleUrl:'./count-import.component.scss'})
export class CountImportComponent extends RfidForm {
 readonly selection=inject(RfidSelection);readonly view=signal<M.SessionView|null>(null);readonly events=signal<M.Local<M.Event>[]>([]);readonly selected=signal<M.Local<M.Event>[]>([]);
 readonly reviewed=signal(false);readonly commonLocation=signal('');readonly entries=this.fb.array<FormGroup>([]);
 readonly form=this.fb.nonNullable.group({countUuid:['',this.uuid],entries:this.entries});
 ngOnInit(){this.selected.set(this.selection.get(this.route.snapshot.paramMap.get('uuid')??''));this.watch(()=>this.load());}
 async load(){await this.request(async()=>({view:await this.get<M.SessionView>('/sessions/'+this.id()),events:await this.get<M.Local<M.Event>[]>('/sessions/'+this.id()+'/events',{offset:this.offset(),limit:this.limit()})}),r=>{this.view.set(r.view);this.events.set(r.events);this.yard.set(r.view.authorization.data.session.yardUuid);});}
 checked(uuid:string){return this.selected().some(r=>r.data.uuid===uuid);}
 toggle(r:M.Local<M.Event>,checked:boolean){if(checked&&this.selected().length>=500){this.error.set('Máximo 500 recibos.');return;}this.selected.update(rows=>checked?[...rows.filter(x=>x.data.uuid!==r.data.uuid),r]:rows.filter(x=>x.data.uuid!==r.data.uuid));this.reviewed.set(false);this.form.markAsDirty();}
 countSelected(uuid:string){this.pick('countUuid',uuid);this.reviewed.set(false);}
 async review(){if(!this.form.controls.countUuid.valid||!this.selected().length){this.error.set('Selecciona conteo y recibos.');return;}
 const locations=new Map(this.entries.controls.map(e=>[e.get('eventUuid')!.value,e.get('locationUuid')!.value]));
 await this.request(()=>this.api.post<Preview[]>('/sessions/'+this.id()+'/count-preview',{uuid:crypto.randomUUID(),countUuid:this.form.controls.countUuid.value,entries:this.selected().map(e=>({eventUuid:e.data.uuid}))}),rows=>{this.entries.clear();for(const row of rows)this.entries.push(this.fb.group({eventUuid:[row.eventUuid],locationUuid:[locations.get(row.eventUuid)??this.commonLocation()??''],expectedItemUuid:[row.expectedItemUuid],version:[row.version],alreadyObserved:[row.observed],previousLocation:[row.locationUuid]}));this.reviewed.set(true);this.form.markAsDirty();});}
 applyLocation(){for(const row of this.entries.controls)row.get('locationUuid')!.setValue(this.commonLocation());this.form.markAsDirty();}
 async save(){if(!this.reviewed()||!this.validForm())return;if(!await confirm(this.dialog,'Importar observaciones revisadas','La importación es atómica. No mueve inventario, resuelve diferencias ni cierra el conteo.'))return;
 const entries=this.entries.getRawValue().map(r=>({eventUuid:r['eventUuid'],locationUuid:r['locationUuid']||null,expectedItemUuid:r['expectedItemUuid'],version:r['version']}));
 await this.mutate(()=>this.pending.post<M.Imported>('/sessions/'+this.id()+'/count-imports',{countUuid:this.form.controls.countUuid.value,entries}),r=>{this.form.markAsPristine();this.selection.set(this.id(),[]);void this.router.navigate(['/inventario/conteos',r.countUuid]);});}
}
