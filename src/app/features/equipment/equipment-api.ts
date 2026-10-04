import { Injectable, inject } from '@angular/core';

import { Api } from '../../core/http/api';

import { Profile, Category, Model, Sheet, Lot, Assembly, Ref, LookupItem, LookupKind } from './models';

@Injectable({providedIn:'root'})

export class EquipmentApi {

  private api=inject(Api);

  list<T extends Ref>(path:string, params:Record<string,string|number>={}) {return this.api.get<T[]>('/equipment/'+path,params);}

  read<T>(path:string) {return this.api.get<T>('/equipment/'+path);}

  create<T extends Ref>(path:string, body:unknown) {return this.api.post<T>('/equipment/'+path,body);}

  update<T extends Ref>(path:string, body:unknown) {return this.api.put<T>('/equipment/'+path,body);}

  profile(uuid:string) {return this.read<Profile>('assets/'+uuid);}

  category(uuid:string) {return this.read<Category>('categories/'+uuid);}

  model(uuid:string) {return this.read<Model>('models/'+uuid);}

  sheet(uuid:string) {return this.read<Sheet>('sheets/'+uuid);}

  lot(uuid:string) {return this.read<Lot>('lots/'+uuid);}

  assembly(uuid:string) {return this.read<Assembly>('assemblies/'+uuid);}

  ownAssembly(asset:string) {return this.read<Assembly|null>('assets/'+asset+'/assembly');}

  lookup(kind:LookupKind, params:Record<string,string|number>) {

    const paths={category:'categories',model:'models',grade:'material-grades',heat:'heats',lot:'lots',asset:'assets',party:'party-options',sheet:'models/'+(params['modelUuid']??'')+'/sheets'};

    const query={...params};if(kind==='sheet')delete query['modelUuid'];

    return this.api.get<LookupItem[]>('/equipment/'+paths[kind],query);

  }

  async find<T extends Ref>(path:string,uuid:string) {for(let offset=0;;offset+=100){const rows=await this.list<T>(path,{offset,limit:100});const result=rows.find(r=>r.uuid===uuid);if(result)return result;if(rows.length<100)throw new Error('El registro ya no está disponible.');}}

  bindQuota(party:string,quota:string,body:unknown) {return this.api.put<Ref>('/parties/'+party+'/distribution-quotas/'+quota+'/technical-target',body);}

}

