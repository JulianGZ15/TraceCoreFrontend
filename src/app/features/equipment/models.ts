export interface Ref { uuid: string; version: number; }

export const technicalKinds = ['GENERAL','PRESSURE_EQUIPMENT','TUBULAR'] as const;

export type TechnicalKind = typeof technicalKinds[number];

export const conditions = ['UNKNOWN','NEW','SERVICEABLE','DAMAGED','UNDER_REPAIR','SCRAPPED'] as const;

export type ConditionCode = typeof conditions[number];

export interface Category extends Ref { code:string; name:string; parentUuid:string|null; technicalKind:TechnicalKind; active:boolean; }

export interface Model extends Ref { code:string; description:string; categoryUuid:string; manufacturerUuid:string; active:boolean; }

export type Unit = 'PSI'|'BAR'|'MPA'|'MM'|'INCH'|'METER'|'KG'|'POUND';

export interface Quantity { valueExact:string; unit:Unit; }

export const quantities = [

  {key:'workingPressure',label:'Presión de trabajo (WP)',dimension:'PRESSURE'},

  {key:'testPressure',label:'Presión de prueba',dimension:'PRESSURE'},

  {key:'bore',label:'Diámetro / bore',dimension:'LENGTH'},

  {key:'wallThickness',label:'Espesor de pared',dimension:'LENGTH'},

  {key:'length',label:'Longitud',dimension:'LENGTH'},

  {key:'width',label:'Ancho',dimension:'LENGTH'},

  {key:'height',label:'Alto',dimension:'LENGTH'},

  {key:'weight',label:'Masa',dimension:'MASS'},

] as const;

export type QuantityKey = typeof quantities[number]['key'];

export type Specs = Record<QuantityKey,Quantity|null> & {temperatureMinExact:string|null;temperatureMaxExact:string|null;temperatureUnit:'CELSIUS'|'FAHRENHEIT'|null;psl:string|null;pr:string|null;temperatureMin?:unknown;temperatureMax?:unknown};

export interface Sheet extends Ref {modelUuid:string;revision:string;validFrom:string;validTo:string|null;specs:Specs;documentReference:string|null;state:'DRAFT'|'APPROVED'|'RETIRED';approvedBy:string|null;approvedAt:string|null;}

export interface Asset extends Ref {sheetUuid:string;internalCode:string;serialNumber:string|null;origin:string;registeredAt:string;lifecycle:'REGISTERED'|'RETIRED';retiredAt:string|null;retirementReason:string|null;referenceValueExact:string|null;currency:string|null;valuationReference:string|null;referenceValue?:unknown;}

export interface Period {validFrom:string;validTo:string|null;}

export interface Owner extends Ref,Period {assetUuid:string;companyUuid:string|null;partyUuid:string|null;titleReference:string;reason:string;}

export interface Condition extends Ref,Period {assetUuid:string;condition:ConditionCode;reason:string;sourceReference:string|null;}

export interface Profile {asset:Asset;technicalSheet:Sheet;model:Model;category:Category;owner:Owner;condition:Condition;}

export interface Grade extends Ref {code:string;name:string;standardReference:string;baseMaterial:string;approved:boolean;approvedBy:string|null;approvedAt:string|null;}

export interface Heat extends Ref {millUuid:string;gradeUuid:string;heatNumber:string;manufacturedOn:string|null;provenance:string;}

export interface Trace extends Ref {assetUuid:string;position:string;heatUuid:string;cladding:string|null;coatingThickness:Quantity|null;documentReference:string|null;}

export interface Lot extends Ref {code:string;type:'PROCUREMENT'|'ADMINISTRATIVE';origin:string;description:string;}

export interface LotMember extends Ref,Period {lotUuid:string;assetUuid:string;reason:string;endReason:string|null;}

export interface LotLink extends LotMember {code:string;type:Lot['type'];}

export interface Assembly extends Ref {parentAssetUuid:string;type:string;compositionRevision:number;}

export interface ComponentMember extends Ref,Period {assemblyUuid:string;componentAssetUuid:string;position:string;reason:string;endReason:string|null;}

export interface AssemblyLink extends ComponentMember {parentAssetUuid:string;}

export interface Usage extends Ref {assetUuid:string;periodFrom:string;periodTo:string;counterFromExact:string;counterToExact:string;hoursExact:string;recordedBy:string;sourceReference:string;supersedesUuid:string|null;correctionReason:string|null;correctedAt:string|null;correctedBy:string|null;}

export interface PartyOption {uuid:string;legalName:string;tradeName:string|null;}

export type LookupItem = Category|Model|Sheet|Grade|Heat|Lot|Asset|PartyOption;

export type LookupKind = 'category'|'model'|'sheet'|'grade'|'heat'|'lot'|'asset'|'party';

export type Purpose = 'MANUFACTURER'|'MILL'|'OWNER';

export const assetSections = [['general','General'],['tecnica','Ficha técnica'],['materiales','Materiales'],['propiedad','Propiedad'],['condicion','Condición'],['lotes','Lotes'],['composicion','Composición'],['uso','Horas de uso']] as const;

export const catalogLinks = [['categorias','Categorías'],['modelos','Modelos y fichas'],['grados','Grados'],['coladas','Coladas'],['lotes','Lotes']] as const;

