import {Injectable,inject,signal,OnDestroy} from '@angular/core';import {Session} from '../../core/auth/session';import {Local,Event} from './models';
@Injectable({providedIn:'root'})export class RfidSelection implements OnDestroy {
 private session=inject(Session);private selections=new Map<string,Local<Event>[]>();private ended=this.session.ended.subscribe(()=>this.selections.clear());
 set(session:string,events:Local<Event>[]){this.selections.set(session,events);}
 get(session:string){return this.selections.get(session)??[];}
 ngOnDestroy(){this.selections.clear();this.ended.unsubscribe();}
}
