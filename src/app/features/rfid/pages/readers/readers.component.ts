import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';import {ReaderComponent} from '../../editors/reader/reader.component';
@Component({selector:'tc-rfid-readers',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./readers.component.html',styleUrl:'./readers.component.scss'})
export class ReadersComponent extends RfidPage {
 readonly rows=signal<M.RemoteRow[]>([]);readonly available=signal(true);
 ngOnInit(){this.watch(()=>this.load());}
 async load(){await this.request(()=>this.get<M.Remote>('/reader-directory',{yardUuid:this.yard(),state:this.route.snapshot.queryParamMap.get('state'),offset:this.offset(),limit:this.limit()}),r=>{this.rows.set(r.rows);this.available.set(r.available);});}
 async create(){if(await this.editor(ReaderComponent,{},'Nuevo registro'))await this.load();}
}
