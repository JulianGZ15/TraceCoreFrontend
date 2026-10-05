import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';
@Component({selector:'tc-rfid-asset',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./asset.component.html',styleUrl:'./asset.component.scss'})
export class AssetComponent extends RfidPage {
 readonly asset=signal<M.Asset|null>(null);readonly bindings=signal<M.Local<M.Binding>[]>([]);readonly inspections=signal<M.Local<M.Inspection>[]>([]);readonly tab=signal('assignments');
 ngOnInit(){this.watch(()=>this.load());}
 async load(){await this.request(async()=>{const asset=await this.get<M.Asset>('/assets/'+this.id()+'/summary');const tab=this.route.snapshot.queryParamMap.get('tab')??'assignments';
 const bindings=tab==='assignments'?await this.get<M.Local<M.Binding>[]>('/assets/'+this.id()+'/assignment-history',{offset:this.offset(),limit:this.limit()}):[];
 const inspections=tab==='inspections'&&asset.binding?await this.get<M.Local<M.Inspection>[]>('/tags/'+asset.binding.tagUuid+'/inspection-history',{offset:this.offset(),limit:this.limit()}):[];return {asset,bindings,inspections,tab};},r=>{this.asset.set(r.asset);this.bindings.set(r.bindings);this.inspections.set(r.inspections);this.tab.set(r.tab);});}
}
