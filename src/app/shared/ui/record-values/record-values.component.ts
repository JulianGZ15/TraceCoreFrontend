import { Component, input, computed } from '@angular/core';
import { displayInstant } from '../../instant';
export const fieldNames: Record<string, string> = {
  uuid: 'UUID',
  documentUuid: 'UUID del documento',
  versionUuid: 'UUID de la versión de archivo',
  currentVersionUuid: 'UUID de la versión vigente',
  subject: 'Destino del vínculo',
  asset: 'Equipo',
  document: 'Documento',
  metadata: 'Datos del archivo',
  partyUuid: 'UUID del tercero',
  assetUuid: 'UUID del equipo',
  yardUuid: 'UUID del patio',
  orderUuid: 'UUID de la orden',
  inspectionUuid: 'UUID de la inspección',
  invoiceUuid: 'UUID de la factura',
  manifestUuid: 'UUID del manifiesto',
  rentalUuid: 'UUID de la renta',
  frameworkUuid: 'UUID del contrato marco',
  title: 'Título',
  type: 'Tipo',
  state: 'Estado',
  classification: 'Clasificación',
  owner: 'Propietario',
  number: 'Número documental',
  version: 'Versión de concurrencia',
  filename: 'Archivo',
  fileName: 'Archivo',
  mediaType: 'Tipo detectado',
  size: 'Bytes',
  sha256: 'SHA-256',
  source: 'Procedencia',
  kind: 'Tipo',
  role: 'Rol',
  validFrom: 'Inicio',
  validTo: 'Fin',
  createdAt: 'Creación',
  uploadedAt: 'Carga',
  decidedAt: 'Decisión',
  decisionReason: 'Motivo de decisión',
  withdrawnAt: 'Retirada',
  withdrawalReason: 'Motivo de retirada',
  internalCode: 'Código interno',
  serialNumber: 'Serial',
  lifecycle: 'Ciclo de vida',
  currency: 'Divisa',
  amount: 'Importe',
  total: 'Total',
  value: 'Valor',
  unit: 'Unidad',
  referenceValue: 'Valoración',
  grossWeightKg: 'Peso bruto (kg)',
  knownWeightKg: 'Peso conocido (kg)',
  receivable: 'Por cobrar',
  payable: 'Por pagar',
  incomingUnapplied: 'Anticipos recibidos',
  outgoingUnapplied: 'Anticipos entregados',
  exposure: 'Exposición',
  creditLimit: 'Límite de crédito',
  availableCredit: 'Crédito disponible',
  commitments: 'Compromisos',
  overdueReceivable: 'Vencido por cobrar',
  overduePayable: 'Vencido por pagar',
  legalName: 'Razón social',
  tradeName: 'Nombre comercial',
  country: 'País',
  active: 'Activo',
  name: 'Nombre',
  code: 'Código',
  description: 'Descripción',
  reason: 'Motivo',
  reference: 'Referencia',
  occurredAt: 'Fecha efectiva',
  recordedAt: 'Registro',
  correlationUuid: 'Correlación',
  changedFields: 'Campos intervenidos',
  actorUuid: 'Actor',
  resourceUuid: 'Recurso',
  resourceType: 'Tipo de recurso',
  action: 'Acción',
  current: 'Vigente',
  downloadable: 'Descarga autorizada',
  effective: 'Efectivo',
  parentAssetUuid: 'Equipo padre',
  componentAssetUuid: 'Componente',
  position: 'Posición',
  inspections: 'Inspecciones',
  certifications: 'Certificaciones',
  dispatchReleased: 'Liberado para despacho',
  technicalReady: 'Preparación técnica',
  balances: 'Saldos por divisa',
  readiness: 'Preparación',
  hourInterval: 'Intervalo de horas',
  counterFrom: 'Contador inicial',
  counterTo: 'Contador final',
  hours: 'Horas',
  baselineHours: 'Base de horas',
  nextDueHours: 'Próxima revisión (horas)',
  minimum: 'Mínimo',
  maximum: 'Máximo',
  quantity: 'Cantidad',
  unitPrice: 'Precio unitario',
  price: 'Precio',
  discount: 'Descuento',
  discountFraction: 'Fracción de descuento',
  taxFraction: 'Fracción de impuesto',
  tax: 'Impuesto',
  taxRate: 'Tasa de impuesto',
  net: 'Neto',
  netAmount: 'Importe neto',
  taxAmount: 'Importe de impuesto',
  totalAmount: 'Importe total',
  balance: 'Saldo',
  credited: 'Acreditado',
  approvedAmount: 'Importe aprobado',
  insuredAmount: 'Suma asegurada',
  totalWeightKg: 'Peso total (kg)',
  maxWeightKg: 'Capacidad de peso (kg)',
  temperatureMin: 'Temperatura mínima',
  temperatureMax: 'Temperatura máxima',
  units: 'Unidades',
  minimumUnits: 'Unidades mínimas',
  remainingNet: 'Neto restante',
  remainingTax: 'Impuesto restante',
  proportionalTax: 'Impuesto proporcional',
  paid: 'Pagado',
  unapplied: 'Sin aplicar',
  previousLimit: 'Límite anterior',
  newLimit: 'Límite nuevo',
  latitude: 'Latitud',
  longitude: 'Longitud',
  positionPercent: 'Ocupación de posiciones (%)',
  score: 'Puntuación',
  seconds: 'Segundos',
  receivedAt: 'Recepción',
};
const decimalFields = new Set([
  'value',
  'amount',
  'total',
  'net',
  'tax',
  'quantity',
  'unitPrice',
  'discount',
  'taxRate',
  'referenceValue',
  'grossWeightKg',
  'knownWeightKg',
  'maxWeightKg',
  'temperatureMin',
  'temperatureMax',
  'counterFrom',
  'counterTo',
  'hours',
  'baselineHours',
  'nextDueHours',
  'hourInterval',
  'minimum',
  'maximum',
  'receivable',
  'payable',
  'incomingUnapplied',
  'outgoingUnapplied',
  'exposure',
  'creditLimit',
  'availableCredit',
  'commitments',
  'overdueReceivable',
  'overduePayable',
  'price',
  'netAmount',
  'taxAmount',
  'totalAmount',
  'units',
  'minimumUnits',
  'approvedAmount',
  'balance',
  'credited',
  'discountFraction',
  'insuredAmount',
  'latitude',
  'longitude',
  'newLimit',
  'paid',
  'positionPercent',
  'previousLimit',
  'proportionalTax',
  'remainingNet',
  'remainingTax',
  'score',
  'seconds',
  'taxFraction',
  'totalWeightKg',
  'unapplied',
]);
const privateFields = new Set([
  'storageKey',
  'fingerprint',
  'password',
  'passwordHash',
  'credential',
  'secret',
]);
export function recordFields(
  value: unknown,
  prefix = '',
  zone = 'UTC',
): { label: string; value: string }[] {
  if (value === null || value === undefined)
    return [{ label: prefix || 'Dato', value: 'Sin dato' }];
  if (Array.isArray(value))
    return value.length
      ? value.flatMap((v, i) => recordFields(v, prefix + ' · ' + (i + 1), zone))
      : [{ label: prefix || 'Registros', value: 'Sin registros' }];
  if (typeof value !== 'object')
    return [
      {
        label: prefix || 'Dato',
        value: typeof value === 'boolean' ? (value ? 'Sí' : 'No') : displayInstant(value, zone),
      },
    ];
  const record = value as Record<string, unknown>;
  return Object.entries(record)
    .filter(([k]) => !privateFields.has(k) && !k.endsWith('Exact'))
    .flatMap(([key, v]) => {
      const label = [prefix, fieldNames[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2')]
        .filter(Boolean)
        .join(' · ');
      if (
        (decimalFields.has(key) || key + 'Exact' in record) &&
        (typeof v === 'number' || v === null || typeof v === 'string')
      ) {
        if (!(key + 'Exact' in record))
          return [{ label, value: 'API incompatible: falta valor exacto' }];
        const exact = record[key + 'Exact'];
        return [
          {
            label,
            value:
              exact === null
                ? 'Sin dato'
                : typeof exact === 'string' && /^-?\d+(?:\.\d+)?$/.test(exact)
                  ? exact
                  : 'API incompatible: valor exacto inválido',
          },
        ];
      }
      return recordFields(v, label, zone);
    });
}
@Component({
  selector: 'tc-record-values',
  templateUrl: './record-values.component.html',
  styleUrl: './record-values.component.scss',
})
export class RecordValuesComponent {
  readonly value = input<unknown>();
  readonly timezone = input('UTC');
  readonly fields = computed(() => recordFields(this.value(), '', this.timezone()));
}
