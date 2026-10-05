import {Component,inject,signal} from '@angular/core';
import {RfidPending,Pending} from '../../pending';
import {Dialog} from '@angular/cdk/dialog';
import {confirm} from '../../../../shared/ui/editor';
import {Feedback} from '../../../../shared/ui/page';
import {errorMessage} from '../../../../core/http/api';
@Component({selector:'tc-rfid-pending',imports:[Feedback],templateUrl:'./pending-requests.component.html',styleUrl:'./pending-requests.component.scss'})
export class PendingRequestsComponent {
 readonly pending=inject(RfidPending);readonly dialog=inject(Dialog);readonly busy=signal(false);readonly message=signal('');
 async recover(r:Pending){this.busy.set(true);try{const result=await this.pending.recover(r);this.message.set(result.confirmed?'Resultado confirmado. Actualiza el expediente.':'Autorización local disponible; la ejecución remota no está confirmada.');}catch(e){this.message.set(e&&typeof e==='object'&&'status' in e&&e.status===404?'No hay resultado confirmado; una solicitud podría seguir en curso.':errorMessage(e));}finally{this.busy.set(false);}}
 async repeat(r:Pending){if(!await confirm(this.dialog,'Repetir la misma solicitud','Se conservarán UUID y datos originales. No cambiaremos el contenido.'))return;this.busy.set(true);try{await this.pending.repeat(r);this.message.set('Solicitud confirmada. Actualiza el expediente.');}catch(e){this.message.set(errorMessage(e));}finally{this.busy.set(false);}}
}
