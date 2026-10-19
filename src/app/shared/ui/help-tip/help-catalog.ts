export interface HelpEntry {
  label: string;
  text: string;
  source: string;
}

/**
 * Field help is keyed by the stable form-control name where possible. Keep
 * definitions short, specific to TraceCore, and sourced for future review.
 */
export const HELP_CATALOG: Readonly<Record<string, HelpEntry>> = {
  scopeType: {
    label: 'Alcance',
    text: 'Define si la asignación aplica a toda la empresa o solo a un patio autorizado.',
    source: 'docs/front/design.md · reglas de acceso por módulo',
  },
  yardUuid: {
    label: 'Patio',
    text: 'Ubicación operativa que limita los registros y acciones disponibles según tus permisos.',
    source: 'docs/front/design.md · permisos y alcance operativo',
  },
  utcOffset: {
    label: 'Desplazamiento UTC',
    text: 'Diferencia entre la hora local capturada y UTC. Usa el formato ±HH:MM, por ejemplo −06:00.',
    source: 'docs/front/design.md · instantes y zona operativa',
  },
  timezone: {
    label: 'Zona horaria',
    text: 'Zona IANA usada para interpretar y mostrar horas locales, por ejemplo America/Mexico_City.',
    source: 'docs/front/design.md · fechas e instantes',
  },
  currency: {
    label: 'Divisa',
    text: 'Moneda del importe. TraceCore conserva cada saldo en su propia divisa; no suma monedas distintas.',
    source: 'docs/front/design.md · política local de finanzas',
  },
  netAmountExact: {
    label: 'Importe neto',
    text: 'Importe antes de impuestos. Se conserva con precisión decimal exacta.',
    source: 'Frontend/TraceCore/src/app/features/finance/models.ts',
  },
  taxAmountExact: {
    label: 'Impuestos',
    text: 'Importe de impuestos calculado para el documento; no equivale al importe neto.',
    source: 'Frontend/TraceCore/src/app/features/finance/models.ts',
  },
  totalAmountExact: {
    label: 'Importe total',
    text: 'Total del documento, incluidos los impuestos calculados por el servidor.',
    source: 'docs/front/design.md · política local de finanzas',
  },
  creditLimit: {
    label: 'Límite de crédito',
    text: 'Monto máximo de crédito acordado para el tercero en la divisa y vigencia indicadas.',
    source: 'src/app/features/partners/pages/terms/terms.component.html · términos comerciales',
  },
  paymentCondition: {
    label: 'Condición de pago',
    text: 'Acuerdo que describe cuándo o bajo qué condición debe realizarse el pago.',
    source: 'src/app/features/partners/pages/terms/terms.component.html · términos comerciales',
  },
  paymentMethod: {
    label: 'Método de pago',
    text: 'Medio acordado para liquidar el pago, por ejemplo transferencia o cheque.',
    source: 'src/app/features/partners/pages/terms/terms.component.html · términos comerciales',
  },
  amount: {
    label: 'Importe',
    text: 'Cantidad monetaria de la operación. La divisa y la precisión se conservan por separado.',
    source: 'docs/front/design.md · política local de finanzas',
  },
  creditDays: {
    label: 'Días de crédito',
    text: 'Número de días concedidos para pagar conforme a las condiciones comerciales vigentes.',
    source: 'src/app/features/partners/pages/terms/terms.component.html · términos comerciales',
  },
  fractionDigits: {
    label: 'Decimales de la divisa',
    text: 'Cantidad de posiciones decimales que se permiten al expresar importes en esta divisa.',
    source: 'src/app/features/finance/models.ts · Currency.fractionDigits',
  },
  from: {
    label: 'Inicio',
    text: 'Fecha u hora de inicio del periodo indicado por el formulario.',
    source: 'src/app/features/commerce/editors · intervalos contractuales',
  },
  to: {
    label: 'Fin',
    text: 'Fecha u hora de término del periodo indicado por el formulario.',
    source: 'src/app/features/commerce/editors · intervalos contractuales',
  },
  plannedFrom: {
    label: 'Inicio previsto',
    text: 'Comienzo planeado del periodo de asignación o servicio.',
    source: 'src/app/features/commerce/editors/allocation/allocation.component.ts',
  },
  plannedTo: {
    label: 'Fin previsto',
    text: 'Término planeado del periodo de asignación o servicio.',
    source: 'src/app/features/commerce/editors/allocation/allocation.component.ts',
  },
  plannedDeparture: {
    label: 'Salida prevista',
    text: 'Fecha y hora planeadas para iniciar el viaje; no confirma que la salida haya ocurrido.',
    source: 'src/app/features/logistics/editors/trip/trip.component.ts',
  },
  maxWeightKg: {
    label: 'Capacidad de peso',
    text: 'Peso máximo permitido para el vehículo, expresado en kilogramos.',
    source: 'src/app/features/logistics/editors/vehicle/vehicle.component.ts',
  },
  avlScope: {
    label: 'Alcance AVL',
    text: 'Categoría o alcance de evaluación del proveedor que TraceCore utiliza al comprobar su elegibilidad para una operación.',
    source: 'src/app/features/partners/partners-api.ts · evaluación de terceros',
  },
  balanceExact: {
    label: 'Saldo',
    text: 'Importe pendiente de liquidar en una cuenta y divisa determinadas.',
    source: 'docs/front/design.md · política local de finanzas',
  },
  projectedExposureExact: {
    label: 'Exposición proyectada',
    text: 'Estimación de compromisos de crédito que el servidor evalúa para el tercero; no es un saldo contable.',
    source: 'docs/front/design.md · política local de finanzas',
  },
  sourceYardUuid: {
    label: 'Patio de origen',
    text: 'Patio desde el que parte el movimiento o despacho.',
    source: 'docs/front/design.md · política local de logística',
  },
  destinationYardUuid: {
    label: 'Patio de destino',
    text: 'Patio al que se dirige el movimiento o despacho.',
    source: 'docs/front/design.md · política local de logística',
  },
  eta: {
    label: 'Llegada estimada',
    text: 'Fecha y hora previstas de llegada; es una estimación y no confirma la recepción.',
    source: 'docs/front/design.md · política local de logística',
  },
  grossWeightKgExact: {
    label: 'Peso bruto',
    text: 'Peso total registrado para el equipo, expresado en kilogramos y conservado con precisión exacta.',
    source: 'Frontend/TraceCore/src/app/features/logistics/models.ts',
  },
  offset: {
    label: 'Desplazamiento UTC',
    text: 'Diferencia entre la hora local capturada y UTC. Usa el formato ±HH:MM, por ejemplo −06:00.',
    source: 'docs/front/design.md · instantes y zona operativa',
  },
  ownerAuthorizationReference: {
    label: 'Referencia de autorización',
    text: 'Identificador o documento que respalda la autorización de propiedad o traslado.',
    source: 'Frontend/TraceCore/src/app/features/logistics/models.ts',
  },
  epcCapacityBits: {
    label: 'Capacidad EPC',
    text: 'Cantidad de bits disponibles para almacenar el código EPC en el chip. No describe la capacidad total de todas sus memorias.',
    source: 'GS1 EPC Tag Data Standard · https://www.gs1.org/standards/tds',
  },
  serializedTid: {
    label: 'TID serializado',
    text: 'Indica si el identificador TID del chip incluye un número de serie único. TID identifica al chip; EPC identifica al objeto.',
    source: 'GS1 EPC Encoder/Decoder FAQ · https://www.gs1.org/services/epc-encoder/faqs',
  },
  tagUuid: {
    label: 'UUID del chip',
    text: 'Identificador interno del registro de TraceCore para el chip RFID; no es el EPC ni el TID almacenados en el chip.',
    source: 'Frontend/TraceCore/src/app/features/rfid/models.ts · esquema RFID del producto',
  },
  epc: {
    label: 'EPC',
    text: 'Código electrónico que identifica el objeto al que se asocia el chip RFID.',
    source: 'GS1 EPC Encoder/Decoder FAQ · https://www.gs1.org/services/epc-encoder/faqs',
  },
  tid: {
    label: 'TID',
    text: 'Identificador de la memoria del chip que describe el propio tag RFID, no el equipo al que está adherido.',
    source: 'GS1 EPC Tag Data Standard · https://www.gs1.org/sites/default/files/docs/epc/tds_1_6-RatifiedStd-20110922.pdf',
  },
  psl: {
    label: 'PSL declarado',
    text: 'Nivel de especificación del producto declarado en su documentación. Los requisitos exactos dependen de la norma y edición aplicables.',
    source: 'API Specification 6A · https://www.api.org/products-and-services/standards/important-standards-announcements/spec-6a',
  },
  workingPressure: {
    label: 'Presión de trabajo',
    text: 'Presión máxima de trabajo declarada para la pieza, conservando la unidad de su ficha técnica.',
    source: 'Frontend/TraceCore/src/app/features/equipment/models.ts · especificaciones de pieza',
  },
  testPressure: {
    label: 'Presión de prueba',
    text: 'Presión declarada para la prueba del equipo. Confirma el método y valor aplicables en la ficha o norma correspondiente.',
    source: 'Frontend/TraceCore/src/app/features/equipment/models.ts · especificaciones de pieza',
  },
  bore: {
    label: 'Diámetro / bore',
    text: 'Diámetro interior declarado de la pieza. Registra el valor y la unidad de su documento técnico.',
    source: 'Frontend/TraceCore/src/app/features/equipment/models.ts · especificaciones de pieza',
  },
  wallThickness: {
    label: 'Espesor de pared',
    text: 'Espesor declarado de la pared del componente; conserva la unidad indicada en el documento.',
    source: 'Frontend/TraceCore/src/app/features/equipment/models.ts · especificaciones de pieza',
  },
  weight: {
    label: 'Masa',
    text: 'Masa declarada del componente, registrada con su unidad.',
    source: 'Frontend/TraceCore/src/app/features/equipment/models.ts · especificaciones de pieza',
  },
  length: {
    label: 'Longitud',
    text: 'Longitud total declarada del componente, registrada con su unidad.',
    source: 'Frontend/TraceCore/src/app/features/equipment/models.ts · especificaciones de pieza',
  },
  width: {
    label: 'Ancho',
    text: 'Ancho declarado del componente, registrado con su unidad.',
    source: 'Frontend/TraceCore/src/app/features/equipment/models.ts · especificaciones de pieza',
  },
  height: {
    label: 'Alto',
    text: 'Altura declarada del componente, registrada con su unidad.',
    source: 'Frontend/TraceCore/src/app/features/equipment/models.ts · especificaciones de pieza',
  },
  mtr: {
    label: 'MTR',
    text: 'Reporte de ensayo del material que documenta propiedades del material y su conformidad con los requisitos especificados.',
    source: 'API Source Inspection Study Guide · https://www.api.org/~/media/files/certification/icp/icp-certification-programs/si_suite_documents/sife/sife_studyguide_english_update-9-17-2015.pdf',
  },
  scopeScore: {
    label: 'Score',
    text: 'Puntuación capturada para el alcance evaluado. Su interpretación depende de la clasificación y reglas registradas.',
    source: 'src/app/features/partners/editors/evaluation-editor/evaluation-editor.component.ts',
  },
  classification: {
    label: 'Clasificación declarada',
    text: 'Resultado categórico registrado para la evaluación; no sustituye la evidencia ni la decisión documentada.',
    source: 'src/app/features/partners/editors/evaluation-editor/evaluation-editor.component.ts',
  },
  regionCode: {
    label: 'Código de región',
    text: 'Clave de la región a la que aplica la cuota o autorización; usa el catálogo acordado con el tercero.',
    source: 'src/app/features/partners/editors/quota-editor/quota-editor.component.ts',
  },
  productScope: {
    label: 'Alcance de producto',
    text: 'Productos o familias de producto cubiertos por la cuota o autorización.',
    source: 'src/app/features/partners/editors/quota-editor/quota-editor.component.ts',
  },
  validFrom: {
    label: 'Inicio de vigencia',
    text: 'Fecha o instante a partir del cual el registro puede considerarse vigente.',
    source: 'Frontend/TraceCore/src/app/features/partners/editors/quota-editor',
  },
  validTo: {
    label: 'Fin de vigencia',
    text: 'Límite final de vigencia. Cuando el campo indica “excluido”, ese instante ya no pertenece al periodo.',
    source: 'docs/front/design.md · intervalos y fechas',
  },
};

export function helpEntry(key: string): HelpEntry | null {
  return HELP_CATALOG[key] ?? null;
}
