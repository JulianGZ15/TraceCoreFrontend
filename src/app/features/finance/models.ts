export type Direction = 'RECEIVABLE' | 'PAYABLE';
export type Operation =
  | 'CURRENCY'
  | 'CHARGE'
  | 'INVOICE'
  | 'CREDIT_NOTE'
  | 'PAYMENT'
  | 'ALLOCATION'
  | 'ACCOUNT'
  | 'REVERSAL';
export interface Entity {
  uuid: string;
  version: number;
  [key: string]: unknown;
}
export interface Row {
  record: Entity;
  uuid?: string;
  label: string;
}
export interface Option {
  uuid: string;
  label: string;
  record?: Entity;
  active?: boolean;
}
export interface Currency extends Entity {
  code: string;
  name: string;
  fractionDigits: number;
  active: boolean;
}
export interface Invoice extends Entity {
  partyUuid: string;
  direction: Direction;
  currency: string;
  fractionDigits: number;
  state: 'DRAFT' | 'POSTED' | 'CANCELLED';
  series: string;
  folio: string;
  issuedAt: string;
  dueAt: string;
  netAmountExact: string;
  taxAmountExact: string;
  totalAmountExact: string;
  reference: string;
  snapshot: Entity | null;
}
export interface InvoiceDetail {
  invoice: Invoice;
  lines?: Entity[];
  charges?: Entity[];
  creditedExact: string;
  paidExact: string;
  balanceExact: string;
  reversed: boolean;
}
export interface PaymentDetail {
  payment: Entity;
  unappliedExact: string;
  reversed: boolean;
  allocations?: Entity[];
}
export interface PartySummary {
  party: Entity;
  currency: string;
  fractionDigits: number;
  account: Entity | null;
  balances: Entity;
  creditEnabled: boolean;
  accountInPeriod: boolean;
  evaluatedAt: string;
}
export interface CalculationPart {
  sourceUuid: string;
  concept: string;
  netAmountExact: string;
  taxAmountExact: string;
  taxFractionExact: string;
  remainingNetExact: string;
  remainingTaxExact: string;
}
export interface Calculation {
  parts: CalculationPart[];
  currency: string;
  fractionDigits: number;
  netAmountExact: string;
  taxAmountExact: string;
  totalAmountExact: string;
  calculationFingerprint: string;
}
export interface Pending {
  actor: string;
  key: string;
  operation: Operation;
  path: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
export interface Field {
  key: string;
  label: string;
  required?: boolean;
  readonly?: boolean;
  max?: number;
  type?: 'text' | 'textarea' | 'select' | 'lookup' | 'decimal' | 'integer' | 'instant';
  choices?: string[];
  resource?: string;
  params?: Record<string, string>;
}
export interface EditorData {
  row?: Entity;
  partyUuid?: string;
  currency?: string;
  direction?: string;
  action?: string;
  resource?: string;
  context?: Entity;
}
export interface Check {
  allowed: boolean;
  blockers: { code: string; orderUuid?: string; sourceUuid?: string }[];
  evaluatedAt: string;
  projectedExposureExact?: string;
  unbilledExact?: string;
}
