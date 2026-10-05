import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';import { ModelComponent } from '../../editors/model/model.component';
@Component({selector:'tc-rfid-tag-models',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./tag-models.component.html',styleUrl:'./tag-models.component.scss'})
export class TagModelsComponent extends RfidPage {
 readonly rows=signal<M.Local<M.TagModel>[]>([]);
 ngOnInit(){this.watch(()=>this.load());}
 async load(){await this.request(()=>this.get<M.Local<M.TagModel>[]>('/tag-models',{yardUuid:this.yard(),offset:this.offset(),limit:this.limit()}),r=>this.rows.set(r));}
 async create(){if(await this.editor(ModelComponent,{yardUuid:this.yard()},'Nuevo registro'))await this.load();}
}
