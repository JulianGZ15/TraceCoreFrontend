import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';
import {viewChild} from '@angular/core';import {DirectionComponent} from '../../editors/direction/direction.component';import {MovementPlanComponent} from '../../../inventory/pages/movement-plan/movement-plan.component';
@Component({selector:'tc-rfid-passage-detail',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent,MovementPlanComponent],templateUrl:'./passage.component.html',styleUrl:'./passage.component.scss'})
export class PassageComponent extends RfidPage {
 readonly row=signal<M.Local<M.Passage>|null>(null);readonly sessionView=signal<M.SessionView|null>(null);readonly histories=signal<M.Local<M.DirectionHistory>[]>([]);readonly preparing=signal(false);readonly planner=viewChild(MovementPlanComponent);
 get form(){return this.planner()?.form;}
 ngOnInit(){this.watch(()=>this.load());}
 async load(){await this.request(async()=>{const row=await this.get<M.Local<M.Passage>>('/passages/'+this.id());return {row,session:await this.get<M.SessionView>('/sessions/'+row.data.sessionUuid),histories:await this.get<M.Local<M.DirectionHistory>[]>('/passages/'+this.id()+'/direction-history',{offset:this.offset(),limit:this.limit()})};},r=>{this.row.set(r.row);this.sessionView.set(r.session);this.histories.set(r.histories);});}
 async direction(){const r=this.row(),s=this.sessionView()?.authorization.data.session;if(r&&s&&await this.editor(DirectionComponent,{row:r.data,uuid:r.data.uuid,version:r.version,yardUuid:s.yardUuid},'Corregir dirección'))await this.load();}
}
