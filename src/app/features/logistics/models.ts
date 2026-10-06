export interface Entity {
  uuid: string;
  version: number;
  [key: string]: unknown;
  state?: string;
  type?: string;
  folio?: string;
  name?: string;
  carrierUuid?: string;
  yardUuid?: string;
  sourceYardUuid?: string | null;
  destinationYardUuid?: string | null;
  sourceSiteUuid?: string | null;
  destinationSiteUuid?: string | null;
  manifestUuid?: string;
  assetUuid?: string;
  rootAssetUuid?: string;
  movementUuid?: string;
  allocationUuid?: string | null;
  orderLineUuid?: string | null;
  filename?: string;
  mediaType?: string;
  size?: number;
  sha256?: string;
  reference?: string;
  grossWeightKgExact?: string | null;
  maxWeightKgExact?: string;
  plannedDeparture?: string;
  eta?: string;
  licenseExpiresAt?: string;
  checkedAt?: string;
  approved?: boolean;
  condition?: string;
  observation?: string;
  received?: boolean;
  transitCustodianUuid?: string;
  destinationCustodianUuid?: string;
  destinationCustodyMode?: string;
  ownerAuthorizationReference?: string;
  reason?: string;
  sourceReference?: string;
}
export interface Manifest extends Entity {
  yardUuid: string;
  state: string;
  type: string;
}
export interface Summary {
  manifest: Manifest;
  trip: Entity | null;
  labels: Record<string, string>;
  rootCount: number;
  pieceCount: number;
  deliveredRootCount: number;
  totalWeightKgExact: string;
  unknownWeightRoots: number;
  carrierUuid: string | null;
}
export interface Row {
  record: Entity;
  label: string;
}
export interface Option {
  uuid: string;
  label: string;
  record?: Entity;
  orderLineUuid?: string;
  orderUuid?: string;
}
export interface MovementDetail {
  movement: Entity;
  items: Entity[];
  logisticsManaged: boolean;
}
export interface VerificationContext {
  expected: string[];
  eventUuids: string[];
  sessionUuid: string | null;
  receiptCount: number;
}
export interface Check extends Entity {
  expected: string[];
  observed: string[];
  missing: string[];
  extra: string[];
  unresolvedEvents: string[];
}
export interface Pending {
  actor: string;
  key: string;
  operation: string;
  path: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'decimal' | 'integer' | 'instant' | 'select' | 'textarea' | 'lookup';
  required?: boolean;
  choices?: string[];
  resource?: string;
  params?: Record<string, string>;
  readonly?: boolean;
  max?: number;
  scale?: number;
}
export interface EditorContext {
  row?: Entity;
  summary?: Summary;
  yard: string;
  action?: string;
}
