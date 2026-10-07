export type SubjectKind =
  | 'ASSET'
  | 'PARTY'
  | 'ORDER'
  | 'RENTAL_CONTRACT'
  | 'FRAMEWORK_CONTRACT'
  | 'MANIFEST'
  | 'INSPECTION'
  | 'INVOICE';
export type EvidenceKind = 'PARTY' | 'QUALITY' | 'COMMERCIAL' | 'LOGISTICS' | 'FINANCIAL';
export interface Subject {
  kind: SubjectKind;
  uuid: string;
}
export interface SubjectOption {
  uuid: string;
  kind: SubjectKind;
  label: string;
}
export interface Document {
  uuid: string;
  title: string;
  type: string;
  classification: 'INTERNAL' | 'CONFIDENTIAL';
  owner: Subject;
  state: 'ACTIVE' | 'ARCHIVED';
  currentVersionUuid: string | null;
  version: number;
  createdAt: string;
  archiveReason: string | null;
}
export interface DocumentVersion {
  uuid: string;
  documentUuid: string;
  number: number;
  version: number;
  state: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  filename: string;
  mediaType: string;
  size: number;
  sha256: string;
  source: { kind: EvidenceKind; uuid: string } | null;
  uploadedAt: string;
  decidedAt: string | null;
  decisionReason: string | null;
}
export interface VersionView {
  metadata: DocumentVersion;
  current: boolean;
  downloadable: boolean;
}
export interface Summary {
  document: Document;
  ownerLabel: string;
  current: VersionView | null;
  latest: VersionView | null;
  actions: { manage: boolean; approve: boolean; archive: boolean; link: boolean };
  evaluatedAt: string;
}
export interface DocumentRow {
  document: Document;
  ownerLabel: string;
}
export interface Link {
  uuid: string;
  subject: Subject;
  versionUuid: string;
  role: string;
  validFrom: string;
  validTo: string | null;
  withdrawnAt: string | null;
  withdrawalReason: string | null;
  version: number;
}
export interface Linked {
  view: { link: Link; document: Document; file: VersionView; effective: boolean };
  subjectLabel: string;
  withdrawable: boolean;
  evaluatedAt: string;
}
export interface EvidenceOption {
  uuid: string;
  kind: EvidenceKind;
  filename: string;
  mediaType: string;
  size: number;
  sha256: string;
}
export const subjectKinds: SubjectKind[] = [
  'ASSET',
  'PARTY',
  'ORDER',
  'RENTAL_CONTRACT',
  'FRAMEWORK_CONTRACT',
  'MANIFEST',
  'INSPECTION',
  'INVOICE',
];
export const subjectNames: Record<SubjectKind, string> = {
  ASSET: 'Equipo',
  PARTY: 'Tercero',
  ORDER: 'Orden',
  RENTAL_CONTRACT: 'Contrato de renta',
  FRAMEWORK_CONTRACT: 'Contrato marco',
  MANIFEST: 'Manifiesto',
  INSPECTION: 'Inspección',
  INVOICE: 'Factura',
};
export const documentTypes = [
  'GENERAL',
  'TECHNICAL',
  'QUALITY',
  'CONTRACT',
  'LEGAL',
  'COMMERCIAL',
  'FINANCIAL',
  'LOGISTICS',
];
