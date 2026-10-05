import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';
import {inject} from '@angular/core';import {RfidPending} from '../../pending';import {RfidSelection} from '../../selection';import {confirm} from '../../../../shared/ui/editor';
@Component({selector:'tc-rfid-session-detail',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./session.component.html',styleUrl:'./session.component.scss'})
export class SessionComponent extends RfidPage {
 readonly view=signal<M.SessionView|null>(null);readonly events=signal<M.Local<M.Event>[]>([]);readonly selected=signal<M.Local<M.Event>[]>([]);readonly direction=signal('UNKNOWN');readonly pending=inject(RfidPending);readonly selection=inject(RfidSelection);private selectedSession='';
 ngOnInit(){this.watch(()=>this.load());this.follow(()=>this.load());}
 async load(){if(this.selectedSession!==this.id()){this.selected.set([]);this.selectedSession=this.id();}
 await this.request(async()=>({view:await this.get<M.SessionView>('/sessions/'+this.id()),events:await this.get<M.Local<M.Event>[]>('/sessions/'+this.id()+'/events',{status:this.route.snapshot.queryParamMap.get('status'),offset:this.offset(),limit:this.limit()})}),r=>{this.view.set(r.view);this.events.set(r.events);});}
 checked(uuid:string){return this.selected().some(r=>r.data.uuid===uuid);}
 toggle(r:M.Local<M.Event>,checked:boolean){if(checked&&this.selected().length>=500){this.error.set('Máximo 500 recibos seleccionados.');return;}this.selected.update(rows=>checked?[...rows.filter(x=>x.data.uuid!==r.data.uuid),r]:rows.filter(x=>x.data.uuid!==r.data.uuid));}
 async close(){if(!await confirm(this.dialog,'Cerrar sesión de captura','El conector dejará de obtener esta sesión. Las entregas pendientes conservan su historial.'))return;await this.mutate(()=>this.api.post('/sessions/'+this.id()+'/close',{}),()=>this.load());}
 async passage(){const s=this.view()?.authorization.data.session;if(!s||!s.gateUuid||!this.selected().length)return;if(!await confirm(this.dialog,'Registrar paso de portón','La dirección es una declaración del operador. Esto no moverá inventario.'))return;
 await this.mutate(()=>this.pending.post<M.Passage>('/passages',{gateUuid:s.gateUuid,sessionUuid:s.uuid,direction:this.direction(),eventUuids:this.selected().map(r=>r.data.uuid)}),r=>{this.selected.set([]);void this.router.navigate(['/rfid/pasos',r.uuid]);});}
 count(){this.selection.set(this.id(),this.selected());void this.router.navigate(['/rfid/sesiones',this.id(),'conteo']);}
 protected override clear(){this.selected.set([]);this.view.set(null);this.events.set([]);}
}
