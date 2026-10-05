import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';
@Component({selector:'tc-rfid-assets',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./assets.component.html',styleUrl:'./assets.component.scss'})
export class AssetsComponent extends RfidPage {
 readonly rows=signal<M.Asset[]>([]);readonly search=signal('');readonly lifecycle=signal('');
 ngOnInit(){this.watch(()=>this.load());}
 async load(){this.search.set(this.route.snapshot.queryParamMap.get('search')??'');this.lifecycle.set(this.route.snapshot.queryParamMap.get('lifecycle')??'');await this.request(()=>this.get<M.Asset[]>('/assets',{yardUuid:this.yard(),search:this.search(),lifecycle:this.lifecycle(),offset:this.offset(),limit:this.limit()}),r=>this.rows.set(r));}
}
