import {Component,inject,signal,OnDestroy} from '@angular/core';import {DIALOG_DATA,DialogRef} from '@angular/cdk/dialog';import {Session} from '../../../../core/auth/session';import {Feedback} from '../../../../shared/ui/page';
@Component({selector:'tc-rfid-credential',imports:[Feedback],templateUrl:'./credential.component.html',styleUrl:'./credential.component.scss'})
export class CredentialComponent implements OnDestroy {
 private readonly data=inject<{token:string}>(DIALOG_DATA);readonly ref=inject(DialogRef);readonly token=signal(this.data.token);readonly message=signal('');private session=inject(Session);private ended=this.session.ended.subscribe(()=>{this.token.set('');this.ref.close();});
 async copy(){try{if(!this.session.valid())return;await navigator.clipboard.writeText(this.token());this.message.set('Credencial copiada. Configúrala en el conector autorizado.');}catch{this.message.set('No se pudo copiar. Selecciona y copia el texto manualmente.');}}
 close(){this.token.set('');this.ref.close();}
 ngOnDestroy(){this.token.set('');this.data.token='';this.ended.unsubscribe();}
}
