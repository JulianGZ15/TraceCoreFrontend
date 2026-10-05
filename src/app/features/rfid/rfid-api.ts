import { Injectable,inject } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';
import { firstValueFrom,merge,Subject,takeUntil } from 'rxjs';
import { Api } from '../../core/http/api';
import { Session } from '../../core/auth/session';
@Injectable({providedIn:'root'})
export class RfidApi {
 private http=inject(HttpClient);private base=inject(Api).base+'/rfid';private session=inject(Session);
 get<T>(path:string,params:Record<string,string|number|null|undefined>={},stop?:Subject<void>){
  const clean:Record<string,string|number>={};for(const [k,v] of Object.entries(params))if(v!=null&&v!=='')clean[k]=v;
  return firstValueFrom(this.http.get<T>(this.base+path,{params:new HttpParams({fromObject:clean})}).pipe(takeUntil(stop?merge(stop,this.session.ended):this.session.ended)));
 }
 inventory<T>(path:string,params:Record<string,string|number|null|undefined>={},stop?:Subject<void>){
  const clean:Record<string,string|number>={};for(const [k,v] of Object.entries(params))if(v!=null&&v!=='')clean[k]=v;
  return firstValueFrom(this.http.get<T>(this.base.replace(/\/rfid$/,'/inventory')+path,{params:new HttpParams({fromObject:clean})}).pipe(takeUntil(stop?merge(stop,this.session.ended):this.session.ended)));
 }
 post<T>(path:string,data:unknown){return firstValueFrom(this.http.post<T>(this.base+path,data).pipe(takeUntil(this.session.ended)));}
 put<T>(path:string,data:unknown){return firstValueFrom(this.http.put<T>(this.base+path,data).pipe(takeUntil(this.session.ended)));}
}
