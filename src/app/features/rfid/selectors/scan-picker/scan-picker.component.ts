import {Component,input,output,inject,signal,effect,untracked,OnDestroy} from '@angular/core';
import {RfidApi} from '../../rfid-api';
import {Api} from '../../../../core/http/api';
import {Session} from '../../../../core/auth/session';
import {Subject} from 'rxjs';
import {Pagination,Feedback} from '../../../../shared/ui/page';
import * as M from '../../models';
type Kind='READERS'|'DEVICES'|'ANTENNAS'|'ASSETS'|'GATES'|'MODELS'|'CONFIG_READERS'|'COUNTS'|'LOCATIONS';
@Component({selector:'tc-rfid-picker',imports:[Pagination,Feedback],templateUrl:'./scan-picker.component.html',styleUrl:'./scan-picker.component.scss'})
export class ScanPickerComponent implements OnDestroy {
 readonly kind=input.required<Kind>();readonly yardUuid=input('');readonly readerUuid=input('');readonly value=input('');readonly label=input('Seleccionar');readonly disabled=input(false);readonly selected=output<string>();
 readonly options=signal<{uuid:string;label:string}[]>([]);readonly offset=signal(0);readonly busy=signal(false);readonly error=signal('');readonly selectedLabel=signal('');
 private api=inject(RfidApi);private core=inject(Api);private session=inject(Session);private generation=0;private alive=true;private stop=new Subject<void>();private context='';
 constructor(){effect(()=>{const context=[this.kind(),this.yardUuid(),this.readerUuid()].join(':');untracked(()=>{if(context!==this.context){this.context=context;this.offset.set(0);}void this.load();});});}
 async load(){const generation=++this.generation,epoch=this.session.epoch(),kind=this.kind();this.stop.next();this.busy.set(true);this.error.set('');
  try{let options:{uuid:string;label:string}[]=[];
   const params={yardUuid:this.yardUuid(),readerUuid:this.readerUuid(),offset:this.offset(),limit:25};
   if(['READERS','DEVICES','ANTENNAS'].includes(kind)){
    if(!this.yardUuid()){this.options.set([]);return;}if(kind!=='READERS'&&!this.readerUuid()){this.options.set([]);return;}
    const remote=await this.api.get<M.Remote>('/scan-options/'+kind,params,this.stop);if(!remote.available)throw new Error('Servicio RFID no disponible.');
    options=remote.rows.map(r=>({uuid:r.uuid,label:r.reader?r.reader.code+' · '+r.reader.name:r.antenna?'Puerto '+r.antenna.port+' · '+r.antenna.name:r.device?.kind+' · '+r.uuid}));
   }else if(kind==='CONFIG_READERS'){const remote=await this.api.get<M.Remote>('/reader-directory',params,this.stop);if(!remote.available)throw new Error('Servicio RFID no disponible.');options=remote.rows.map(r=>({uuid:r.uuid,label:r.reader!.code+' · '+r.reader!.name}));}
   else if(kind==='ASSETS'){const rows=await this.api.get<M.Asset[]>('/assets',params,this.stop);options=rows.map(r=>({uuid:r.identity.uuid,label:r.identity.internalCode+' · '+(r.identity.serialNumber??'Sin serial')}));}
   else if(kind==='GATES'){const rows=await this.api.get<M.Local<M.Gate>[]>('/gates',params,this.stop);options=rows.filter(r=>r.data.active).map(r=>({uuid:r.data.uuid,label:r.data.code+' · '+r.data.name}));}
   else if(kind==='MODELS'){const rows=await this.api.get<M.Local<M.TagModel>[]>('/tag-models',params,this.stop);options=rows.filter(r=>r.data.active).map(r=>({uuid:r.data.uuid,label:r.data.manufacturer+' · '+r.data.model}));}
   else {if(!this.yardUuid()){this.options.set([]);return;}const rows=await this.api.inventory<{uuid:string;code:string;name?:string;state?:string}[]>(kind==='COUNTS'?'/counts':'/locations',params,this.stop);options=rows.filter(r=>kind!=='COUNTS'||r.state==='OPEN').map(r=>({uuid:r.uuid,label:r.code+(r.name?' · '+r.name:'')}));}
   if(this.alive&&generation===this.generation&&epoch===this.session.epoch()){this.options.set(options);const chosen=options.find(o=>o.uuid===this.value());if(chosen)this.selectedLabel.set(chosen.label);}
  }catch(e){if(this.alive&&generation===this.generation)this.error.set(e instanceof Error?e.message:'No se pudieron cargar las opciones.');}finally{if(this.alive&&generation===this.generation)this.busy.set(false);}
 }
 choose(v:string){this.selectedLabel.set(this.options().find(o=>o.uuid===v)?.label??v);this.selected.emit(v);}
 page(offset:number){this.offset.set(offset);void this.load();}
 ngOnDestroy(){this.alive=false;this.generation++;this.stop.next();this.stop.complete();}
}
