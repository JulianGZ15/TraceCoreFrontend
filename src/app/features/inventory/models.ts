export interface Versioned {
  uuid: string;
  version: number;
}
export type Placement = 'YARD' | 'EXTERNAL_SITE' | 'UNLOCATED' | 'IN_TRANSIT';
export type MovementType = 'INBOUND' | 'TRANSFER' | 'OUTBOUND' | 'RETURN' | 'ADJUSTMENT';
export type MovementState = 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
export const locationTypes = [
  'SECTOR',
  'BAY',
  'RACK',
  'SLOT',
  'WORKSHOP',
  'QUARANTINE',
  'BUNKER',
  'STAGING',
];
export const siteTypes = ['WELL', 'RIG', 'PLATFORM', 'TERMINAL', 'OTHER'];
export const movementTypes: MovementType[] = [
  'INBOUND',
  'TRANSFER',
  'OUTBOUND',
  'RETURN',
  'ADJUSTMENT',
];
export const custodyModes = ['STORAGE', 'CONSIGNMENT', 'REPAIR', 'RENTAL', 'TRANSPORT'];
export const conditions = ['UNKNOWN', 'NEW', 'SERVICEABLE', 'DAMAGED', 'UNDER_REPAIR', 'SCRAPPED'];
export interface Location extends Versioned {
  yardUuid: string;
  parentUuid: string | null;
  code: string;
  name: string;
  type: string;
  active: boolean;
  maxPositions: number | null;
  maxWeightKg: number | null;
  maxWeightKgExact: string | null;
  exclusive: boolean;
}
export interface Site extends Versioned {
  parentUuid: string | null;
  code: string;
  name: string;
  type: string;
  operatorUuid: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  latitudeExact: string | null;
  longitudeExact: string | null;
  active: boolean;
}
export interface Occupancy {
  locationUuid: string;
  positions: number;
  identifiedPieces: number;
  knownWeightKgExact: string;
  unknownWeightGroups: number;
  maxPositions: number | null;
  maxWeightKgExact: string | null;
  positionPercentExact: string | null;
}
export interface Overview {
  path: Location[];
  items: { location: Location; occupancy: Occupancy }[];
}
export interface AssetRow {
  uuid: string;
  internalCode: string;
  serialNumber: string | null;
  lifecycle: string;
  rootAssetUuid: string;
  yardUuid: string | null;
  locationUuid: string | null;
  siteUuid: string | null;
  transitMovementUuid: string | null;
  placementState: Placement;
}
export interface Asset extends Versioned {
  internalCode: string;
  serialNumber: string | null;
  lifecycle: string;
  referenceValue: number | null;
  referenceValueExact: string | null;
  currency: string | null;
}
export interface Assignment extends Versioned {
  assetUuid: string;
  rootAssetUuid: string;
  locationUuid: string | null;
  siteUuid: string | null;
  grossWeightKg: number | null;
  grossWeightKgExact: string | null;
  weightReference: string | null;
  validFrom: string;
  validTo: string | null;
  movementUuid: string | null;
  endMovementUuid: string | null;
}
export interface Custody extends Versioned {
  assetUuid: string;
  companyUuid: string | null;
  partyUuid: string | null;
  yardUuid: string | null;
  mode: string;
  validFrom: string;
  validTo: string | null;
  agreementReference: string;
  reason: string;
}
export interface Profile {
  asset: Asset;
  assignment: Assignment | null;
  custody: Custody | null;
  transit: Movement | null;
  placementState: Placement;
}
export interface Availability {
  assetUuid: string;
  from: string;
  to: string;
  administrativelyAvailable: boolean;
  reasons: string[];
}
export interface Movement extends Versioned {
  folio: string;
  type: MovementType;
  state: MovementState;
  sourceYardUuid: string | null;
  sourceSiteUuid: string | null;
  destinationYardUuid: string | null;
  destinationSiteUuid: string | null;
  reason: string;
  sourceReference: string;
  destinationCustodyMode: string;
  ownerAuthorizationReference: string | null;
  createdOn: string;
  dispatchedAt: string | null;
  receivedAt: string | null;
  authorizationReference: string | null;
  repairAuthorizationReference: string | null;
}
export interface MovementItem extends Versioned {
  assetUuid: string;
  rootAssetUuid: string;
  destinationLocationUuid: string | null;
  destinationSiteUuid: string | null;
  actualDestinationLocationUuid: string | null;
  grossWeightKg: number | null;
  grossWeightKgExact: string | null;
  weightReference: string | null;
  reservationUuid: string | null;
  receivedCondition: string | null;
  receptionReason: string | null;
}
export interface MovementDetail {
  logisticsManaged: boolean;
  movement: Movement;
  items: MovementItem[];
}
export interface RootInput {
  assetUuid: string;
  destinationLocationUuid: string | null;
  destinationSiteUuid: string | null;
  grossWeightKg: string | null;
  weightReference: string | null;
  reservationUuid: string | null;
}
export interface MovementInput {
  requestKey: string;
  type: MovementType;
  roots: RootInput[];
  reason: string;
  sourceReference: string;
  transitCustodianUuid: string | null;
  destinationCustodianUuid: string | null;
  destinationCustodyMode: string;
  ownerAuthorizationReference: string | null;
}
export interface Reservation extends Versioned {
  requestKey: string;
  rootAssetUuid: string;
  assetUuid: string;
  yardUuid: string;
  beneficiaryUuid: string | null;
  validFrom: string;
  validTo: string;
  expiresAt: string;
  state: string;
  requestReference: string;
  consumedMovementUuid: string | null;
}
export interface ReservationDetail {
  reservation: Reservation;
  memberCount: number;
}
export interface Observation {
  assetUuid: string | null;
  identifier: string | null;
}
export interface Proposal extends Versioned {
  type: MovementType;
  state: string;
  sourceYardUuid: string | null;
  destinationYardUuid: string | null;
  sourceSiteUuid: string | null;
  destinationSiteUuid: string | null;
  destinationCustodyMode: string;
  proposedAt: string;
  expiresAt: string;
  reason: string;
  sourceReference: string;
  externalEventUuid: string | null;
}
export interface ProposalItem extends Versioned {
  assetUuid: string | null;
  rootAssetUuid: string | null;
  expected: boolean;
  observed: boolean;
  observedIdentifier: string | null;
  accepted: boolean | null;
}
export interface Decision extends Versioned {
  action: string;
  reason: string;
  movementUuid: string | null;
  decidedAt: string;
}
export interface ProposalDetail {
  proposal: Proposal;
  items: ProposalItem[];
  decision: Decision | null;
}
export interface Count extends Versioned {
  openedBy: string;
  closedBy: string | null;
  folio: string;
  yardUuid: string;
  locationUuid: string | null;
  method: string;
  state: string;
  openedAt: string;
  expectedCount: number;
  sourceReference: string;
  closedAt: string | null;
  closureReason: string | null;
}
export interface CountItem extends Versioned {
  assetUuid: string | null;
  expectedLocationUuid: string | null;
  observedLocationUuid: string | null;
  expected: boolean;
  observed: boolean;
  observedIdentifier: string | null;
  difference: string;
  resolution: string | null;
  resolutionReason: string | null;
  adjustmentMovementUuid: string | null;
}
export interface PartyOption {
  uuid: string;
  legalName: string;
  tradeName: string | null;
}
export const inventoryPermissions = [
  'INVENTORY_READ',
  'INVENTORY_MANAGE',
  'MOVEMENT_MANAGE',
  'DISPATCH_APPROVE',
  'INVENTORY_ADJUST',
  'RESERVATION_MANAGE',
  'CUSTODY_MANAGE',
  'INVENTORY_OBSERVE',
];
