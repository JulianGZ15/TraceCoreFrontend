export interface Versioned {
  uuid: string;
  version: number;
}
export interface Asset extends Versioned {
  internalCode: string;
  serialNumber: string | null;
  lifecycle: string;
  categoryUuid: string;
  categoryCode: string;
  modelUuid: string;
  modelCode: string;
  sheetUuid: string;
  sheetRevision: string;
  condition: string | null;
  yardUuid: string | null;
  registeredAt: string;
}
export interface Option {
  uuid: string;
  label: string;
  code: string;
}
export interface Standard extends Versioned {
  organization: string;
  code: string;
  edition: string;
  title: string;
  active: boolean;
}
export interface Requirement extends Versioned {
  sheetUuid: string;
  standardUuid: string;
  scope: string;
  requirements: string;
  requireMtr: boolean;
  requireCertification: boolean;
  approvedAt: string | null;
  revokedAt: string | null;
}
export interface Mtr extends Versioned {
  issuerUuid: string;
  number: string;
  certificateType: string;
  documentRevision: string;
  issuedAt: string;
  evidenceUuid: string;
  state: string;
  reviewReason: string | null;
  reviewedAt: string | null;
  revokedAt: string | null;
}
export interface Link extends Versioned {
  certificateUuid: string;
  heatUuid?: string;
  assetUuid?: string;
  materialTraceUuid?: string | null;
  withdrawnAt: string | null;
  withdrawnBy: string | null;
  withdrawalReason: string | null;
}
export interface Criterion {
  parameter: string;
  unit: string;
  minimum: unknown;
  minimumExact: string | null;
  maximum: unknown;
  maximumExact: string | null;
}
export interface Policy extends Versioned {
  modelUuid: string | null;
  categoryUuid: string | null;
  standardUuid: string;
  revision: string;
  method: string;
  calendarDays: number | null;
  hourInterval: unknown;
  hourIntervalExact: string | null;
  requireMtr: boolean;
  requireCertification: boolean;
  validFrom: string;
  validTo: string | null;
  criteria: Criterion[];
  state: string;
}
export interface Inspection extends Versioned {
  assetUuid: string;
  policyUuid: string;
  scheduledAt: string;
  inspectorUuid: string;
  facility: string;
  criteria: Criterion[];
  state: string;
  performedAt: string | null;
  verdict: string | null;
  findings: string | null;
  evidenceUuid: string | null;
  baselineHours: unknown;
  baselineHoursExact: string | null;
  nextDueAt: string | null;
  nextDueHours: unknown;
  nextDueHoursExact: string | null;
  reviewReason: string | null;
}
export interface Measurement extends Criterion, Versioned {
  inspectionUuid: string;
  value: unknown;
  valueExact: string;
  result: string;
}
export interface WorkOrder extends Versioned {
  assetUuid: string;
  kind: string;
  reason: string;
  scheduledAt: string;
  responsibleUuid: string;
  workshopUuid: string | null;
  providerUuid: string | null;
  state: string;
  startedAt: string | null;
  completedAt: string | null;
  evidenceUuid: string | null;
  completionReason: string | null;
}
export interface Task extends Versioned {
  orderUuid: string;
  code: string;
  description: string;
  requirements: string;
  completedAt: string | null;
  evidenceUuid: string | null;
  completionReason: string | null;
}
export interface Certification extends Versioned {
  assetUuid: string;
  standardUuid: string;
  inspectionUuid: string;
  issuerUuid: string;
  number: string;
  scope: string;
  issuedAt: string;
  expiresAt: string;
  evidenceUuid: string;
  revokedAt: string | null;
}
export interface Hold extends Versioned {
  assetUuid: string;
  type: string;
  reason: string;
  inspectionUuid: string | null;
  orderUuid: string | null;
  evidenceUuid: string;
  openedAt: string;
  closedAt: string | null;
  closureReason: string | null;
}
export interface Release extends Versioned {
  assetUuid: string;
  scope: string;
  issuedAt: string;
  validFrom: string;
  validTo: string;
  evidenceUuid: string;
  revokedAt: string | null;
  effective: boolean;
  ineffectiveReasons: string[];
  evaluatedAt: string;
}
export interface Readiness {
  assetUuid: string;
  technicallyReady: boolean;
  dispatchReleased: boolean;
  reasons: string[];
  nextDueAt: string | null;
  nextDueHours: unknown;
  nextDueHoursExact: string | null;
  evaluatedAt: string;
}
export interface Evidence extends Versioned {
  fileName: string;
  mediaType: string;
  size: number;
  sha256: string;
  uploadedAt: string;
}
export interface Trace extends Versioned {
  position: string;
  heatUuid: string;
  heatNumber: string;
}
export interface Coverage {
  materialTraceUuid: string | null;
  heatUuid: string | null;
  position: string;
  covered: boolean;
  certificateUuid: string | null;
  number: string | null;
  linkType: string | null;
}
export interface Row<T> {
  record: T;
  assetCode: string;
  serialNumber: string | null;
}
export interface Receipt {
  key: string;
  operation: string;
  assetUuid: string;
  resourceUuid: string;
  createdAt: string;
}
export type CreationResource = 'inspections' | 'maintenance' | 'releases';
export interface Pending {
  actor: string;
  key: string;
  resource: CreationResource;
  payload: Record<string, unknown>;
  createdAt: string;
}
