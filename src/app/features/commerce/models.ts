export interface Entity {
  uuid: string;
  version: number;
  [key: string]: unknown;
  state?: string;
  type?: string;
  folio?: string;
  series?: string;
  partyUuid?: string;
  yardUuid?: string;
  currency?: string;
  orderUuid?: string;
  agreementUuid?: string;
  lineUuid?: string;
  assetUuid?: string;
  rootAssetUuid?: string;
  assignmentUuid?: string;
  modelUuid?: string;
  kind?: string;
  unit?: string;
  concept?: string;
  lineNumber?: number;
  mode?: string;
  filename?: string;
  mediaType?: string;
  size?: number;
  sha256?: string;
  reference?: string;
  validFrom?: string;
  validTo?: string | null;
  plannedFrom?: string;
  plannedTo?: string;
  actualFrom?: string | null;
  actualTo?: string | null;
  quantityExact?: string;
  unitPriceExact?: string;
  discountFractionExact?: string;
  taxFractionExact?: string;
  netAmountExact?: string;
  taxAmountExact?: string;
  totalAmountExact?: string;
  amountExact?: string;
  minimumUnitsExact?: string;
  unitsExact?: string;
  insuredAmountExact?: string;
  cancellationReason?: string | null;
}
export interface Order extends Entity {
  type: 'OC' | 'OV' | 'OR';
  partyUuid: string;
  yardUuid: string;
  currency: string;
  state: string;
}
export interface Summary {
  labels?: Record<string, string>;
  nextLineNumber?: number;
  order: Order;
  purchase: Entity | null;
  sale: Entity | null;
  rental: Entity | null;
}
export interface Row {
  record: Entity;
  label: string;
}
export interface Option {
  uuid: string;
  label: string;
  tradeName?: string;
  ownerUuid?: string;
  ownerPartyUuid?: string;
}
export interface Preview {
  assignmentUuid: string;
  from: string;
  to: string;
  slices: Entity[];
  totalAmountExact: string;
  currency: string;
  calculationFingerprint: string;
}
export interface CreditContext {
  orderUuid: string;
  payerUuid: string;
  currency: string;
  fractionDigits: number;
  account: Entity | null;
  commitment: Entity | null;
}
export interface MovementDetail {
  movement: Entity;
  items: Entity[];
}
export interface ReceiptDetail {
  receipt: Entity;
  items: Entity[];
}
export interface ReturnDetail {
  returned: Entity;
  items: Entity[];
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
  rental?: Entity;
  yard: string;
  action?: string;
}
