import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';import {DeviceComponent as DeviceEditor} from '../../editors/device/device.component';import {CredentialComponent} from '../../editors/credential/credential.component';import {confirm} from '../../../../shared/ui/editor';import {firstValueFrom} from 'rxjs';
@Component({selector:'tc-rfid-device-detail',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./device.component.html',styleUrl:'./device.component.scss'})
export class DeviceComponent extends RfidPage {
 readonly row=signal<M.RemoteRow|null>(null);readonly available=signal(true);
 ngOnInit(){this.watch(()=>this.load());}
 async load(){await this.request(()=>this.get<M.Remote>('/devices/'+this.id()),r=>{this.row.set(r.rows[0]??null);this.available.set(r.available);});}
 async edit(){const row=this.row();if(row&&await this.editor(DeviceEditor,{row:row.device,uuid:row.uuid,version:row.version},'Editar configuración'))await this.load();}
 async rotate(){const r=this.row();if(!r||!await confirm(this.dialog,'Rotar credencial','La credencial actual dejará de funcionar. Si se pierde la respuesta habrá que rotar otra vez.'))return;
 await this.mutate(()=>this.api.post<M.Credential>('/devices/'+r.uuid+'/rotate',{version:r.version}),async c=>{const ref=this.dialog.open(CredentialComponent,{data:{token:c.token},ariaLabel:'Credencial nueva',disableClose:true,width:'min(720px,calc(100vw - 32px))'});await firstValueFrom(ref.closed);await this.load();});}}
