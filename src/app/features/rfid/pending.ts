import { Injectable,inject,signal,OnDestroy } from '@angular/core';
import { RfidApi } from './rfid-api';
import { Session } from '../../core/auth/session';
export interface Pending {actor:string;uuid:string;path:string;body:Record<string,unknown>;shape:string;}
function canonical(v:unknown):unknown{if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>k!=='requestKey').sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,canonical(x)]));return v;}
@Injectable({providedIn:'root'})
export class RfidPending implements OnDestroy {
 private api=inject(RfidApi);private session=inject(Session);private storage='tracecore.rfid.pending';
 readonly records=signal<Pending[]>([]);private end=this.session.ended.subscribe(()=>this.clear());
 constructor(){try{const actor=this.session.user()?.uuid;const raw=JSON.parse(sessionStorage.getItem(this.storage)??'[]');if(Array.isArray(raw))this.records.set(raw.filter(r=>r.actor===actor&&typeof r.uuid==='string'&&/^\/(sessions|commands|passages)(?:\/[a-f0-9-]{36}\/(count-imports|proposal))?$/.test(r.path)&&r.body&&typeof r.body==='object'));}catch{this.clear();}}
 private persist(){if(this.records().length)sessionStorage.setItem(this.storage,JSON.stringify(this.records()));else sessionStorage.removeItem(this.storage);}
 clear(){this.records.set([]);sessionStorage.removeItem(this.storage);}
 ngOnDestroy(){this.end.unsubscribe();}
 private remove(id:string){this.records.update(r=>r.filter(x=>x.uuid!==id));this.persist();}
 async post<T>(path:string,body:Record<string,unknown>){
  const actor=this.session.user()?.uuid;if(!actor||!this.session.valid())throw new Error('Sesión no válida.');
  const without={...body};delete without['uuid'];const shape=JSON.stringify(canonical(without));
  const existing=this.records().find(r=>r.actor===actor&&r.path===path&&r.shape===shape);
  const uuid=existing?.uuid??crypto.randomUUID();const payload=existing?.body??{...body,uuid};
  const record:Pending={actor,uuid,path,body:payload,shape};if(!existing){this.records.update(r=>[...r,record]);this.persist();}
  try{const result=await this.api.post<T>(path,payload);if(this.session.user()?.uuid===actor&&this.session.valid())this.remove(uuid);return result;}
  catch(e){const status=e&&typeof e==='object'&&'status' in e?e.status:0;if(typeof status==='number'&&status>0&&status<500&&status!==408)this.remove(uuid);throw e;}
 }
 async repeat<T>(record:Pending){if(record.actor!==this.session.user()?.uuid||!this.session.valid())throw new Error('Solicitud de otra sesión.');const result=await this.api.post<T>(record.path,record.body);if(this.session.valid()&&record.actor===this.session.user()?.uuid)this.remove(record.uuid);return result;}
 async recover(record:Pending){if(record.actor!==this.session.user()?.uuid||!this.session.valid())throw new Error('Solicitud de otra sesión.');
  let path=record.path+'/'+record.uuid;if(record.path==='/commands')path+='/status';
  const result=await this.api.get<unknown>(path);
  let confirmed=true;if(record.path==='/sessions'){const view=result as import('./models').SessionView;confirmed=!!view.remote?.available&&view.remote.rows.length>0;}if(record.path==='/commands'){const view=result as import('./models').CommandView;confirmed=!!view.execution?.available&&view.execution.rows.length>0;}
  if(confirmed&&this.session.valid()&&record.actor===this.session.user()?.uuid)this.remove(record.uuid);return {confirmed,result};
 }
}
