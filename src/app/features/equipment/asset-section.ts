import {Directive,inject,signal,OnInit,DestroyRef,Type} from '@angular/core';

import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {EquipmentPage} from './page-base';

import {AssetStore} from './asset-store';

import {Ref} from './models';

@Directive()

export abstract class AssetSection<T extends Ref> extends EquipmentPage implements OnInit {

 readonly store=inject(AssetStore);readonly rows=signal<T[]>([]);readonly offset=signal(0);readonly limit=signal(25);private destroyRef=inject(DestroyRef);abstract readonly kind:string;

 ngOnInit(){this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(query=>{this.offset.set(Math.max(0,Number(query.get('offset'))||0));this.limit.set(Math.min(100,Math.max(1,Number(query.get('limit'))||25)));void this.load();});}

 async load(){await this.request(()=>this.api.list<T>('assets/'+this.store.uuid+'/'+this.kind,{offset:this.offset(),limit:this.limit()}),rows=>this.rows.set(rows));}

 move(offset:number){return this.router.navigate([],{relativeTo:this.route,queryParams:{offset,limit:this.limit()}});}

 resize(limit:number){this.limit.set(limit);void this.move(0);}

 active(){return this.store.profile()?.asset.lifecycle==='REGISTERED';}

 async open<C>(component:Type<C>,data:unknown){if(await this.editor(component,data)){if(this.alive&&this.session.valid()){this.success.set('Registro guardado.');await this.load();await this.request(()=>this.store.load(),()=>{});}}}

 override ngOnDestroy(){super.ngOnDestroy();this.rows.set([]);}

}

