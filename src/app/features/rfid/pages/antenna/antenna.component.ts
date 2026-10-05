import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';import {AntennaComponent as AntennaEditor} from '../../editors/antenna/antenna.component';
@Component({selector:'tc-rfid-antenna-detail',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./antenna.component.html',styleUrl:'./antenna.component.scss'})
export class AntennaComponent extends RfidPage {
 readonly row=signal<M.RemoteRow|null>(null);readonly available=signal(true);
 ngOnInit(){this.watch(()=>this.load());}
 async load(){await this.request(()=>this.get<M.Remote>('/antennas/'+this.id()),r=>{this.row.set(r.rows[0]??null);this.available.set(r.available);});}
 async edit(){const row=this.row();if(row&&await this.editor(AntennaEditor,{row:row.antenna,uuid:row.uuid,version:row.version},'Editar configuración'))await this.load();}
 }
