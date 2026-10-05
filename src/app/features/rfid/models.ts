export interface Identity { uuid:string; internalCode:string; serialNumber:string|null; lifecycle:string; yardUuid:string|null; sheetUuid:string; sheetRevision:string; categoryCode:string; modelCode:string; condition:string|null; }
export interface Binding { uuid:string; tagUuid:string; assetUuid:string; validFrom:string; validTo:string|null; reason:string; retirementReference:string|null; }
export interface Asset { identity:Identity; binding:Binding|null; }
export interface Local<T> { data:T; version:number; createdAt:string; }
export interface TagModel { uuid:string; manufacturer:string; model:string; epcCapacityBits:number; serializedTid:boolean; active:boolean; }
export interface Tag { uuid:string; modelUuid:string; tid:string|null; state:string; }
export interface Gate { uuid:string; yardUuid:string; code:string; name:string; active:boolean; }
export interface Reader { uuid:string; yardUuid:string; code:string; name:string; kind:'FIXED'|'HANDHELD'; active:boolean; }
export interface Device { uuid:string; readerUuid:string; yardUuid:string; kind:'DESKTOP'|'MOBILE'|'GATEWAY'; active:boolean; }
export interface Antenna { uuid:string; readerUuid:string; gateUuid:string|null; port:number; name:string; active:boolean; }
export interface ScanSession { uuid:string; readerUuid:string; deviceUuid:string; yardUuid:string; gateUuid:string|null; actorUuid:string; purpose:'IDENTIFY'|'COUNT'|'GATE'; openedAt:string; expiresAt:string; }
export interface Authorization { uuid:string; session:ScanSession; }
export interface Command { uuid:string; readerUuid:string; deviceUuid:string; tagUuid:string; assetUuid:string; type:'WRITE_EPC'|'INSPECT_TAG'; expectedEpc:string; expectedTid:string; expiresAt:string; }
export interface CommandResult { uuid:string; commandUuid:string; selectedTagCount:number; success:boolean; readBackEpc:string|null; readBackTid:string|null; crcValid:boolean|null; memoryValid:boolean|null; capturedAt:string; failureCode:string|null; }
export interface Programming { uuid:string; command:Command; state:string; result:CommandResult|null; confirmedAssignment:Binding|null; }
export interface Event { uuid:string; sessionUuid:string; yardUuid:string; gateUuid:string|null; assetUuid:string|null; assignmentUuid:string|null; status:string; receivedAt:string; reading:{uuid:string; epc:string; epcBits:number; tid:string|null; firstSeenAt:string; lastSeenAt:string; readCount:number; rssi:number|null; antennaUuid:string|null;}; }
export interface Passage { uuid:string; gateUuid:string; sessionUuid:string; direction:'UNKNOWN'|'ENTRY'|'EXIT'; eventUuids:string[]; proposalUuid:string|null; }
export interface Inspection { uuid:string; tagUuid:string; commandUuid:string; inspectedAt:string; readBackEpc:string|null; readBackTid:string|null; crcValid:boolean|null; memoryValid:boolean|null; result:string; }
export interface Epc { uuid:string; tagUuid:string; epc:string; epcBits:number; validFrom:string; validTo:string|null; commandUuid:string; }
export interface RemoteRow { uuid:string; version:number; reader:Reader|null; device:Device|null; antenna:Antenna|null; session:ScanSession|null; command:Command|null; state:string|null; lastSeenAt:string|null; credentialConfigured:boolean|null; leaseUntil:string|null; attempts:number|null; nextAttemptAt:string|null; errorCode:string|null; sessionUuid:string|null; commandUuid:string|null; }
export interface Remote { available:boolean; rows:RemoteRow[]; }
export interface SessionView { authorization:Local<Authorization>; remote:Remote; }
export interface CommandView { authorization:Local<Programming>; execution:Remote; delivery:Remote; }
export interface Imported { uuid:string; actorUuid:string; sessionUuid:string; countUuid:string; itemUuids:string[]; createdAt:string; }
export interface DirectionHistory { uuid:string; previousDirection:string; direction:string; reason:string; actorUuid:string; createdAt:string; }
export interface ProgrammingTag { tag:Tag; model:TagModel; }
export interface Credential { device:Device; token:string; }
