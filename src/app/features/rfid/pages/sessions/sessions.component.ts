import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';
@Component({selector:'tc-rfid-sessions',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./sessions.component.html',styleUrl:'./sessions.component.scss'})
export class SessionsComponent extends RfidPage {
 readonly rows=signal<M.Local<M.Authorization>[]>([]);
 ngOnInit(){this.watch(()=>this.load());}
 async load(){await this.request(()=>this.get<M.Local<M.Authorization>[]>('/sessions',{yardUuid:this.yard(),offset:this.offset(),limit:this.limit()}),r=>this.rows.set(r));}
 
}
