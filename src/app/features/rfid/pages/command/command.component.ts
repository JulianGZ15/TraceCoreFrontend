import {Component,signal} from '@angular/core';import {RouterLink} from '@angular/router';import {FormsModule,ReactiveFormsModule,FormControl,FormGroup,Validators} from '@angular/forms';
import {PageHeading,Feedback,Pagination} from '../../../../shared/ui/page';import {RfidPage} from '../../page-base';import {RfidNavComponent} from '../../shared/rfid-nav/rfid-nav.component';import {PendingRequestsComponent} from '../../shared/pending-requests/pending-requests.component';import * as M from '../../models';
import {BindingComponent} from '../../editors/binding/binding.component';import {diagnostic} from '../../rules';
@Component({selector:'tc-rfid-command-detail',imports:[RouterLink,FormsModule,PageHeading,Feedback,Pagination,RfidNavComponent,PendingRequestsComponent],templateUrl:'./command.component.html',styleUrl:'./command.component.scss'})
export class CommandComponent extends RfidPage {
 readonly view=signal<M.CommandView|null>(null);readonly asset=signal<M.Asset|null>(null);readonly diagnostic=diagnostic;
 ngOnInit(){this.watch(()=>this.load());this.follow(()=>this.load());}
 async load(){await this.request(async()=>{const view=await this.get<M.CommandView>('/commands/'+this.id()+'/status');return {view,asset:await this.get<M.Asset>('/assets/'+view.authorization.data.command.assetUuid+'/summary')};},r=>{this.view.set(r.view);this.asset.set(r.asset);});}
 async bind(){const a=this.asset(),v=this.view();if(!a||!v)return;if(await this.editor(BindingComponent,{uuid:this.id(),assetUuid:a.identity.uuid,yardUuid:a.identity.yardUuid,expectedAssignmentUuid:a.binding?.uuid??null},'Confirmar vínculo'))await this.load();}
}
