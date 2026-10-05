import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';
@Component({selector:'tc-rfid-deliveries',imports:[FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./deliveries.component.html',styleUrl:'./deliveries.component.scss'})
export class DeliveriesComponent extends RfidPage {
 readonly rows=signal<M.RemoteRow[]>([]);readonly available=signal(true);
 ngOnInit(){this.watch(()=>this.load());}
 async load(){await this.request(()=>this.get<M.Remote>('/deliveries',{yardUuid:this.yard(),state:this.route.snapshot.queryParamMap.get('state'),offset:this.offset(),limit:this.limit()}),r=>{this.rows.set(r.rows);this.available.set(r.available);});}
 async requeue(r:M.RemoteRow){if(!await this.discardDelivery())return;await this.mutate(()=>this.api.post('/deliveries/'+r.uuid+'/requeue',{version:r.version}),()=>this.load());}async discardDelivery(){return (await import('../../../../shared/ui/editor')).confirm(this.dialog,'Reencolar entrega','Solo reencolamos esta entrega FAILED. El worker conserva su payload e identidad.');}
}
