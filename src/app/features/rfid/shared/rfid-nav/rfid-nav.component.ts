import {Component,inject} from '@angular/core';
import {RouterLink,RouterLinkActive} from '@angular/router';
import {RfidAccess} from '../../access';
@Component({selector:'tc-rfid-nav',imports:[RouterLink,RouterLinkActive],templateUrl:'./rfid-nav.component.html',styleUrl:'./rfid-nav.component.scss'})
export class RfidNavComponent {readonly access=inject(RfidAccess);}
