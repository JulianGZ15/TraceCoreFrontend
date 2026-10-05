import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';
import {diagnostic} from '../../rules';
@Component({selector:'tc-rfid-tag-detail',imports:[FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./tag.component.html',styleUrl:'./tag.component.scss'})
export class TagComponent extends RfidPage {
 readonly row=signal<M.Local<M.Tag>|null>(null);readonly epcs=signal<M.Local<M.Epc>[]>([]);readonly inspections=signal<M.Local<M.Inspection>[]>([]);readonly tab=signal('epcs');readonly diagnostic=diagnostic;
 ngOnInit(){this.watch(()=>this.load());}
 async load(){await this.request(async()=>{const row=await this.get<M.Local<M.Tag>>('/tags/'+this.id()+'/summary');const tab=this.route.snapshot.queryParamMap.get('tab')??'epcs';const params={offset:this.offset(),limit:this.limit()};return {row,tab,epcs:tab==='epcs'?await this.get<M.Local<M.Epc>[]>('/tags/'+this.id()+'/epc-history',params):[],inspections:tab==='inspections'?await this.get<M.Local<M.Inspection>[]>('/tags/'+this.id()+'/inspection-history',params):[]};},r=>{this.row.set(r.row);this.tab.set(r.tab);this.epcs.set(r.epcs);this.inspections.set(r.inspections);});}
}
