export interface Summary {
  profile: unknown;
  sections: Record<string, boolean>;
  generatedAt: string;
}
export interface Section {
  authorized: boolean;
  data: unknown;
  collection: string | null;
  generatedAt: string;
}
export interface InventoryRow {
  assetUuid: string;
  internalCode: string;
  serialNumber: string | null;
  modelCode: string;
  modelUuid: string;
  categoryUuid: string;
  lifecycle: string;
  yardUuid: string | null;
  locationUuid: string | null;
  siteUuid: string | null;
  rootAssetUuid: string | null;
  grossWeightKg: number | null;
  grossWeightKgExact: string | null;
}
export interface Dashboard {
  generatedAt: string;
  yardUuid: string;
  inventory: {
    identifiedPieces: number;
    positions: number;
    knownWeightKgExact?: string;
    unknownWeightGroups: number;
    assetsInTransit: number;
    pendingProposals: number;
  };
  commercial: { authorized: boolean; data: unknown };
  logistics: { authorized: boolean; data: unknown };
  qualityHolds: { authorized: boolean; data: unknown };
}
export const equipmentSections: Record<
  string,
  { label: string; backend: string; collections: Record<string, string> }
> = {
  resumen: { label: 'Resumen', backend: '', collections: {} },
  tecnica: {
    label: 'Historia técnica',
    backend: 'technicalHistory',
    collections: {
      owners: 'Propiedad',
      conditions: 'Condición',
      materials: 'Materiales',
      usage: 'Horas',
    },
  },
  composicion: {
    label: 'Composición',
    backend: 'composition',
    collections: { memberships: 'Participación en conjuntos' },
  },
  inventario: {
    label: 'Inventario',
    backend: 'inventory',
    collections: { locations: 'Ubicación', custody: 'Custodia' },
  },
  calidad: {
    label: 'Calidad',
    backend: 'quality',
    collections: {
      inspections: 'Inspecciones',
      certifications: 'Certificaciones',
      maintenance: 'Mantenimiento',
      holds: 'Retenciones',
      releases: 'Liberaciones',
    },
  },
  rfid: {
    label: 'RFID',
    backend: 'rfid',
    collections: { bindings: 'Asignaciones', receipts: 'Recibos' },
  },
  comercial: { label: 'Comercial', backend: 'commercial', collections: { orders: 'Órdenes' } },
  documentos: { label: 'Documentos', backend: 'documents', collections: { links: 'Vínculos' } },
};
export const partySections: typeof equipmentSections = {
  resumen: { label: 'Resumen', backend: '', collections: {} },
  contactos: {
    label: 'Contactos e identidad fiscal',
    backend: 'contacts',
    collections: { contacts: 'Contactos', addresses: 'Domicilios' },
  },
  avl: {
    label: 'AVL y habilitación',
    backend: 'avl',
    collections: {
      evaluations: 'Evaluaciones',
      certifications: 'Certificaciones',
      quotas: 'Cuotas',
      terms: 'Condiciones comerciales',
    },
  },
  comercial: { label: 'Comercial', backend: 'commercial', collections: { orders: 'Órdenes' } },
  finanzas: {
    label: 'Finanzas por divisa',
    backend: 'finance',
    collections: { invoices: 'Facturas', payments: 'Pagos' },
  },
  evidencias: { label: 'Evidencias', backend: 'evidence', collections: { files: 'Archivos' } },
  documentos: { label: 'Documentos', backend: 'documents', collections: { links: 'Vínculos' } },
};
