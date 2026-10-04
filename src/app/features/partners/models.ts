export interface Resource {
  uuid: string;
  version: number;
}
export interface Party extends Resource {
  legalName: string;
  tradeName: string | null;
  country: string;
  active: boolean;
}
export interface PartyData {
  legalName: string;
  tradeName: string | null;
  country: string;
  active: boolean;
}
export const partyRoles = [
  'CUSTOMER',
  'SUPPLIER',
  'OEM',
  'DISTRIBUTOR',
  'CONTRACTOR',
  'CARRIER',
  'INSURER',
] as const;
export type PartyRoleCode = (typeof partyRoles)[number];
export type Operation = 'OC' | 'OV' | 'OR';
export type Verification = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'REVOKED';
export interface Period {
  validFrom: string;
  validTo: string | null;
  revokedAt?: string | null;
}
export interface Role extends Resource, Period {
  partyUuid: string;
  role: PartyRoleCode;
}
export interface Contact extends Resource {
  partyUuid: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  extension: string | null;
  primary: boolean;
  active: boolean;
}
export interface Address extends Resource {
  partyUuid: string;
  type: 'FISCAL' | 'COMMERCIAL' | 'DELIVERY';
  line1: string;
  line2: string | null;
  locality: string;
  region: string | null;
  postalCode: string | null;
  country: string;
  active: boolean;
}
export interface Tax extends Resource {
  partyUuid: string;
  country: string;
  type: string;
  number: string;
  evidenceUuid: string | null;
  verification: Verification;
  verifiedBy: string | null;
  verifiedAt: string | null;
}
export interface Certificate extends Resource {
  partyUuid: string;
  standard: string;
  number: string;
  issuer: string;
  issuedOn: string;
  expiresOn: string | null;
  evidenceUuid: string | null;
  verification: Verification;
  verifiedBy: string | null;
  verifiedAt: string | null;
}
export interface Evidence extends Resource {
  partyUuid: string;
  filename: string;
  mediaType: string;
  size: number;
  sha256: string;
}
export interface Terms extends Resource, Period {
  partyUuid: string;
  currency: string;
  paymentMethod: string;
  paymentCondition: string;
  creditDays: number;
  creditLimitExact: string;
}
export interface Authorization extends Resource, Period {
  partyUuid: string;
  operation: Operation;
  approvedBy: string;
  approvedAt: string;
  revokedBy: string | null;
}
export interface Evaluation extends Resource {
  partyUuid: string;
  scope: string;
  score: number;
  classification: string;
  decision: 'APPROVED' | 'CONDITIONAL' | 'REJECTED';
  findings: string;
  evaluatorUuid: string;
  evaluatedAt: string;
  nextReviewAt: string;
}
export interface Quota extends Resource, Period {
  partyUuid: string;
  yardUuid: string | null;
  regionCode: string | null;
  productScope: string;
  quantity: number;
  conditions: string;
  categoryUuid: string | null;
  modelUuid: string | null;
}
export interface QuotaYard {
  uuid: string;
  code: string;
  name: string;
  timezone: string;
}
export interface Eligibility {
  allowed: boolean;
  reason: string;
}
export type Kind =
  | 'roles'
  | 'contacts'
  | 'addresses'
  | 'tax-identities'
  | 'certifications'
  | 'commercial-terms'
  | 'operation-authorizations'
  | 'avl-evaluations'
  | 'distribution-quotas'
  | 'evidence';
export const fullLists: Kind[] = ['roles', 'tax-identities', 'operation-authorizations'];
export const sections = [
  ['general', 'General'],
  ['roles', 'Roles'],
  ['contactos', 'Contactos'],
  ['domicilios', 'Domicilios'],
  ['fiscal', 'Identificaciones fiscales'],
  ['certificaciones', 'Certificaciones'],
  ['evidencias', 'Evidencias'],
  ['condiciones', 'Condiciones'],
  ['autorizaciones', 'Autorizaciones'],
  ['avl', 'AVL'],
  ['cuotas', 'Cuotas'],
] as const;
