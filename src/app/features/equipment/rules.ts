import { FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms';

import { Specs, Quantity, quantities, QuantityKey, Unit } from './models';

export { toInstant } from '../access/assignment-time';

export const uuidPattern=/^[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/;

export const labels:Record<string,string>={GENERAL:'General',PRESSURE_EQUIPMENT:'Equipo de presión',TUBULAR:'Tubular',DRAFT:'Borrador',APPROVED:'Aprobada',RETIRED:'Retirado',REGISTERED:'Registrado',UNKNOWN:'Desconocida',NEW:'Nuevo',SERVICEABLE:'Utilizable (declarado)',DAMAGED:'Dañado',UNDER_REPAIR:'En reparación',SCRAPPED:'Descarte',PROCUREMENT:'Compra',ADMINISTRATIVE:'Administrativo',CELSIUS:'Celsius',FAHRENHEIT:'Fahrenheit'};

export const label=(v:string)=>labels[v]??v;

export function scaled(value:string,scale=6):bigint {

  if(!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value))throw new Error('Indica un decimal con punto, sin separadores.');

  const negative=value.startsWith('-'),[integer,fraction='']=(negative?value.slice(1):value).split('.');

  if(fraction.length>scale)throw new Error('Demasiados decimales.');

  return BigInt(integer+fraction.padEnd(scale,'0'))*(negative?-1n:1n);

}

export function decimal(value:unknown,integers=12,scale=6,positive=false):boolean {

  if(typeof value!=='string'||!new RegExp(`^(?:0|[1-9]\\d{0,${integers-1}})(?:\\.\\d{1,${scale}})?$`).test(value))return false;

  return !positive||scaled(value,scale)>0n;

}

export const decimalValidator=(integers=12,scale=6,positive=false):ValidatorFn=>c=>c.value===''||c.value==null?null:decimal(c.value,integers,scale,positive)?null:{decimal:true};

export function exact(value:unknown):string {if(typeof value!=='string'||! /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value))throw new Error('Backend incompatible: falta un valor decimal exacto.');return value;}

export function numberText(value:unknown) {try{return exact(value);}catch{return 'Backend incompatible: falta decimal exacto.';}}

export function quantityText(q:Quantity|null|undefined) {return q?numberText(q.valueExact)+' '+q.unit:'Sin dato';}

export const units:Record<string,Unit[]>={PRESSURE:['PSI','BAR','MPA'],LENGTH:['MM','INCH','METER'],MASS:['KG','POUND']};

export function specsForm(){const controls:Record<string,FormControl|FormGroup>={};for(const q of quantities) controls[q.key]=new FormGroup({value:new FormControl('',{nonNullable:true}),unit:new FormControl('',{nonNullable:true})}, {validators:quantityValidator(q.dimension)});

  for(const key of ['temperatureMin','temperatureMax','temperatureUnit','psl','pr'])controls[key]=new FormControl('',{nonNullable:true});

  return new FormGroup(controls,{validators:temperatureValidator});

}

const quantityValidator=(dimension:string):ValidatorFn=>g=>{const v=g.get('value')?.value,u=g.get('unit')?.value;return !v&&!u?null:decimal(v,12,6,true)&&units[dimension].includes(u)?null:{quantity:true};};

export const temperatureValidator:ValidatorFn=g=>{const min=g.get('temperatureMin')?.value,max=g.get('temperatureMax')?.value,unit=g.get('temperatureUnit')?.value;if(!min&&!max&&!unit)return null;

 try {const a=scaled(min),b=scaled(max);const zero=unit==='CELSIUS'?scaled('-273.15'):unit==='FAHRENHEIT'?scaled('-459.67'):null;return zero!==null&&a>=zero&&b>=a&&b<=scaled('10000')?null:{temperature:true};}catch{return {temperature:true};}};

export function readSpecs(form:FormGroup,s:Specs){const values:Record<string,unknown>={};for(const q of quantities){const item=s[q.key];values[q.key]=item?{value:exact(item.valueExact),unit:item.unit}:{value:'',unit:''};}

  for(const key of ['temperatureMin','temperatureMax'] as const){const value=s[(key+'Exact') as 'temperatureMinExact'|'temperatureMaxExact']; if(value==null&&s[key]!=null)exact(value);values[key]=value==null?'':exact(value);}

  values['temperatureUnit']=s.temperatureUnit??'';values['psl']=s.psl??'';values['pr']=s.pr??'';form.reset(values);

}

export function writeSpecs(form:FormGroup){const raw=form.getRawValue(),result:Record<string,unknown>={};for(const q of quantities){const item=raw[q.key];result[q.key]=item.value?{value:item.value,unit:item.unit}:null;}for(const key of ['temperatureMin','temperatureMax','temperatureUnit','psl','pr'])result[key]=raw[key]===''?null:raw[key];return result;}

export function approvalMissing(form:FormGroup,kind:string){const required:QuantityKey[]=kind==='PRESSURE_EQUIPMENT'?['workingPressure','testPressure','bore']:kind==='TUBULAR'?['bore','wallThickness','length']:[];return required.filter(key=>!form.get(key+'.value')?.value).map(key=>quantities.find(q=>q.key===key)!.label);}

export function instantInput(value:string|null){return value?value.slice(0,16):'';}

export function prettyDate(value:string|null,zone:string) {if(!value)return 'Sin fin';return new Intl.DateTimeFormat('es-MX',{timeZone:zone,dateStyle:'medium',timeStyle:'short'}).format(new Date(value))+' · '+zone;}

export function localError(error:unknown){return error instanceof Error&&!('status' in error)?error.message:'';}

export function calendarValid(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}

export const optionalText=(max:number)=>Validators.maxLength(max);

