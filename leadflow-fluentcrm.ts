type JsonObject = Record<string, unknown>;

export type LeadflowTier = 'ORO' | 'PLATA' | 'DESCARTE';
export type LeadflowCrmStatus = LeadflowTier | 'PENDIENTE' | 'DESCARTE_LOCAL';
export type LeadflowEvaluatedBy = 'pending' | 'ia' | 'local';
export type FluentCrmPayloadMode = 'nested' | 'flat' | 'hybrid';

export interface FluentCrmUpsertInput {
  payload: unknown;
  tier: LeadflowCrmStatus;
  tierCode: string;
  evaluatedBy: LeadflowEvaluatedBy;
  discardReason?: string | null;
  aiConsultingText?: string | null;
  dolorPsicologico?: string | null;
  estrategiaCierre?: string | null;
  crmContactId?: string | null;
}

export interface FluentCrmUpsertResult {
  success: boolean;
  crmContactId: string | null;
  rawResponse?: unknown;
  diagnostics?: FluentCrmUpsertDiagnostics;
}

export interface FluentCrmUpsertDiagnostics {
  payloadMode: FluentCrmPayloadMode;
  tagsSent: Array<string | number>;
  listsSent: Array<string | number>;
  customFieldKeys: string[];
  nativeFieldKeys: string[];
  fluentStatus?: number;
  fluentContentType?: string;
  fluentResponseWasJson?: boolean;
  tagDeliveryMode: 'names' | 'ids';
  listDeliveryMode: 'names' | 'ids';
}

// Estos slugs deben coincidir exactamente con FluentCRM.
// No corregir ortografia ni completar sufijos truncados.
const FLUENTCRM_CUSTOM_FIELD_SLUGS = {
  descarteMotivo: 'leadflow_descarte_motivo',
  evaluadoPor: 'leadflow_evaluado_por',
  codigoEvaluacion: 'leadflow_codigo_evaluacio',
  clasificacion: 'leadflow_clasificacion',
  compania: 'leadflow_compania',
  tamanoEquipo: 'leadflow_tamano_equipo',
  frenoDuplicacion: 'leadflow_freno_duplicacio',
  origenLeads: 'leadflow_origen_leads',
  financiacion: 'leadflow_financiacion',
  tomaDecision: 'leadflow_toma_decision',
  eventId: 'leadflow_event_id',
  fbp: 'leadflow_fbp',
  fbc: 'leadflow_fbc',
  ttclid: 'leadflow_ttclid',
  ttp: 'leadflow_ttp',
  aiDiagnostico: 'leadflow_ai_diagnostico',
  dolorPsicologico: 'leadflow_dolor_psicologic',
  estrategiaCierre: 'leadflow_estrategia_cierr',
  estadoVenta: 'leadflow_estado_venta',
  fechaEvaluacion: 'leadflow_fecha_evaluacion',
} as const;

const LEADFLOW_LIST_NAME = 'LeadFlow Leads';
const DEFAULT_PAYLOAD_MODE: FluentCrmPayloadMode = 'hybrid';

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getObject(value: unknown): JsonObject | undefined {
  return isJsonObject(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function getOptionLabel(value: unknown): string | undefined {
  const objectValue = getObject(value);

  return asString(objectValue?.label) ?? asString(objectValue?.value) ?? asString(value);
}

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: '',
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function extractPayloadFields(payload: JsonObject) {
  const respuestas = getObject(payload.respuestas);
  const contacto = getObject(respuestas?.contacto);
  const pais = getObject(contacto?.pais);
  const visitor = getObject(payload.visitor) ?? getObject(payload.visitorData);
  const address = getObject(payload.address);
  const analytics = getObject(payload.analytics);

  return {
    nombre: asString(payload.nombre) ?? asString(payload.nombre_completo) ?? asString(contacto?.nombre_completo),
    telefono: asString(payload.telefono) ?? asString(contacto?.whatsapp),
    email: asString(payload.email) ?? asString(contacto?.email),
    pais: asString(payload.pais) ?? asString(pais?.label) ?? asString(visitor?.country_name) ?? asString(pais?.code),
    ciudad: asString(payload.city) ?? asString(address?.city) ?? asString(visitor?.city),
    estado: asString(payload.state) ?? asString(payload.region) ?? asString(address?.state) ?? asString(visitor?.region),
    codigoPostal: asString(payload.postal_code) ?? asString(payload.zip) ?? asString(address?.postal_code) ?? asString(address?.zip),
    direccion1: asString(payload.address_line_1) ?? asString(address?.address_line_1),
    direccion2: asString(payload.address_line_2) ?? asString(address?.address_line_2),
    compania: asString(payload.compania) ?? asString(respuestas?.compania_producto),
    tamanoEquipo: getOptionLabel(payload.tamanoEquipo) ?? getOptionLabel(respuestas?.tamano_equipo),
    frenoDuplicacion: asString(payload.frenoDuplicacionRaw) ?? asString(respuestas?.principal_problema),
    origenLeads: getOptionLabel(payload.origenLeadsRaw) ?? getOptionLabel(respuestas?.inversion_ads),
    financiacion: getOptionLabel(payload.financiacion) ?? getOptionLabel(respuestas?.posicion_frente_a_inversion),
    tomaDecision: getOptionLabel(payload.tomaDecision) ?? getOptionLabel(respuestas?.decision_de_compra),
    eventId: asString(payload.eventId) ?? asString(analytics?.eventId),
    fbp: asString(payload.fbp) ?? asString(analytics?.fbp),
    fbc: asString(payload.fbc) ?? asString(analytics?.fbc),
    ttclid: asString(payload.ttclid) ?? asString(payload.ttc) ?? asString(analytics?.ttclid),
    ttp: asString(analytics?.ttp),
  };
}

function getTrafficTag(fields: ReturnType<typeof extractPayloadFields>): string {
  if (fields.fbc || fields.fbp) return 'leadflow-meta';
  if (fields.ttclid || fields.ttp) return 'leadflow-tiktok';

  return 'leadflow-organico';
}

function getStatusTags(input: FluentCrmUpsertInput, fields: ReturnType<typeof extractPayloadFields>): string[] {
  const tags = new Set<string>(['leadflow', getTrafficTag(fields)]);

  if (input.tier === 'ORO') tags.add('leadflow-oro');
  if (input.tier === 'PLATA') tags.add('leadflow-plata');
  if (input.tier === 'DESCARTE') tags.add('leadflow-descarte');
  if (input.tier === 'DESCARTE_LOCAL' || input.evaluatedBy === 'local') {
    tags.add('leadflow-descarte');
    tags.add('leadflow-guillotina-local');
  }
  if (input.evaluatedBy === 'ia') tags.add('leadflow-ai-evaluated');

  return [...tags];
}

function findCrmContactId(value: unknown): string | null {
  if (!isJsonObject(value)) return null;

  const directId =
    asString(value.crmContactId) ??
    asString(value.crm_contact_id) ??
    asString(value.contactId) ??
    asString(value.contact_id) ??
    asString(value.id);

  if (directId) return directId;

  const contact = getObject(value.contact);
  return asString(contact?.id) ?? asString(contact?.contact_id) ?? null;
}

function debugFluentCrm(message: string, details: JsonObject): void {
  console.info(message, details);
}

function warnFluentCrm(message: string, details: JsonObject): void {
  console.warn(message, details);
}

function maskEmail(value: string | undefined): string {
  if (!value) return '';

  const [name = '', domain = ''] = value.split('@');
  if (!domain) return `${name.slice(0, 2)}***`;

  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(value: string | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  const tail = digits.slice(-3);

  return tail ? `***${tail}` : '***';
}

function textField(value: string | null | undefined): string {
  return value ?? '';
}

function responsePreview(value: unknown): string {
  if (typeof value === 'string') return value.slice(0, 300);

  try {
    return JSON.stringify(value).slice(0, 300);
  } catch {
    return '[unserializable response]';
  }
}

function getCrmClassification(tier: LeadflowCrmStatus): string {
  return tier === 'DESCARTE_LOCAL' ? 'DESCARTE' : tier;
}

function getSalesState(tier: LeadflowCrmStatus): string {
  return tier === 'PENDIENTE' ? 'Pendiente' : 'Nuevo';
}

function buildFluentCrmContact(fields: ReturnType<typeof extractPayloadFields>): JsonObject {
  const fullName = textField(fields.nombre);
  const { firstName, lastName } = splitFullName(fullName);

  return {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: textField(fields.email),
    phone: textField(fields.telefono),
    country: textField(fields.pais),
    city: textField(fields.ciudad),
    state: textField(fields.estado),
    postal_code: textField(fields.codigoPostal),
    address_line_1: textField(fields.direccion1),
    address_line_2: textField(fields.direccion2),
  };
}

function getPayloadMode(): FluentCrmPayloadMode {
  const mode = process.env.FLUENTCRM_WEBHOOK_PAYLOAD_MODE;

  if (mode === 'nested' || mode === 'flat' || mode === 'hybrid') {
    return mode;
  }

  if (mode) {
    warnFluentCrm('[leadflow-fluentcrm] Invalid FLUENTCRM_WEBHOOK_PAYLOAD_MODE, falling back to hybrid', {
      payloadMode: mode,
    });
  }

  return DEFAULT_PAYLOAD_MODE;
}

function envFlag(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === 'true';
}

function parseTagIds(): Record<string, string | number> {
  const rawJson = process.env.FLUENTCRM_TAG_IDS_JSON;
  if (!rawJson) return {};

  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!isJsonObject(parsed)) return {};

    return Object.entries(parsed).reduce<Record<string, string | number>>((accumulator, [key, value]) => {
      const id = asString(value);
      if (id) accumulator[key] = /^\d+$/.test(id) ? Number(id) : id;
      return accumulator;
    }, {});
  } catch {
    warnFluentCrm('[leadflow-fluentcrm] Could not parse FLUENTCRM_TAG_IDS_JSON', {
      reason: 'invalid_json',
    });
    return {};
  }
}

function resolveTags(tags: string[]): {
  tags: Array<string | number>;
  mode: 'names' | 'ids';
} {
  if (!envFlag('FLUENTCRM_USE_NUMERIC_TAG_IDS')) {
    return {
      tags,
      mode: 'names',
    };
  }

  const tagIds = parseTagIds();
  const resolvedTags = tags.reduce<Array<string | number>>((accumulator, tag) => {
    const tagId = tagIds[tag];

    if (tagId === undefined) {
      warnFluentCrm('[leadflow-fluentcrm] FluentCRM tag ID missing; omitting tag in numeric mode', {
        tag,
      });
      return accumulator;
    }

    accumulator.push(tagId);
    return accumulator;
  }, []);

  return {
    tags: resolvedTags,
    mode: 'ids',
  };
}

function resolveLists(): {
  lists: Array<string | number>;
  mode: 'names' | 'ids';
} {
  if (!envFlag('FLUENTCRM_USE_NUMERIC_LIST_IDS')) {
    return {
      lists: [LEADFLOW_LIST_NAME],
      mode: 'names',
    };
  }

  const listId = asString(process.env.FLUENTCRM_LEADFLOW_LIST_ID);

  if (!listId) {
    warnFluentCrm('[leadflow-fluentcrm] FLUENTCRM_LEADFLOW_LIST_ID is missing; omitting list in numeric mode', {
      reason: 'missing_list_id',
    });
    return {
      lists: [],
      mode: 'ids',
    };
  }

  return {
    lists: [/^\d+$/.test(listId) ? Number(listId) : listId],
    mode: 'ids',
  };
}

function buildCustomFields(input: FluentCrmUpsertInput, fields: ReturnType<typeof extractPayloadFields>): JsonObject {
  return {
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.codigoEvaluacion]: input.tierCode,
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.clasificacion]: getCrmClassification(input.tier),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.compania]: textField(fields.compania),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.tamanoEquipo]: textField(fields.tamanoEquipo),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.frenoDuplicacion]: textField(fields.frenoDuplicacion),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.origenLeads]: textField(fields.origenLeads),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.financiacion]: textField(fields.financiacion),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.tomaDecision]: textField(fields.tomaDecision),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.eventId]: textField(fields.eventId),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.fbp]: textField(fields.fbp),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.fbc]: textField(fields.fbc),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.ttclid]: textField(fields.ttclid),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.ttp]: textField(fields.ttp),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.aiDiagnostico]: textField(input.aiConsultingText),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.dolorPsicologico]: textField(input.dolorPsicologico),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.estrategiaCierre]: textField(input.estrategiaCierre),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.estadoVenta]: getSalesState(input.tier),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.fechaEvaluacion]: new Date().toISOString(),
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.evaluadoPor]: input.evaluatedBy,
    [FLUENTCRM_CUSTOM_FIELD_SLUGS.descarteMotivo]: textField(input.discardReason),
  };
}

function buildFluentCrmLeadflowBodyWithDiagnostics(input: FluentCrmUpsertInput): {
  body: JsonObject;
  diagnostics: FluentCrmUpsertDiagnostics;
} {
  if (!isJsonObject(input.payload)) {
    throw new Error('Leadflow payload must be a JSON object.');
  }

  const fields = extractPayloadFields(input.payload);
  const payloadMode = getPayloadMode();
  const contact = buildFluentCrmContact(fields);
  const customFields = buildCustomFields(input, fields);
  const resolvedTags = resolveTags(getStatusTags(input, fields));
  const resolvedLists = resolveLists();
  // TODO: Si se necesita guardar IP en FluentCRM, crear un custom field oficial
  // tipo `leadflow_client_ip` y mapear analytics.clientIp aqui.

  const baseBody: JsonObject = {
    source: 'leadflow',
    status: 'subscribed',
    list: resolvedLists.lists[0] ?? '',
    lists: resolvedLists.lists,
    tags: resolvedTags.tags,
    crmContactId: input.crmContactId ?? null,
    leadflow: {
      status: input.tier,
      tierCode: input.tierCode,
      evaluatedBy: input.evaluatedBy,
    },
  };

  const body =
    payloadMode === 'nested'
      ? {
          ...baseBody,
          contact,
          custom_fields: customFields,
        }
      : payloadMode === 'flat'
        ? {
            ...baseBody,
            ...contact,
            ...customFields,
          }
        : {
            ...baseBody,
            ...contact,
            ...customFields,
            contact,
            custom_fields: customFields,
          };

  return {
    body,
    diagnostics: {
      payloadMode,
      tagsSent: resolvedTags.tags,
      listsSent: resolvedLists.lists,
      customFieldKeys: Object.keys(customFields),
      nativeFieldKeys: Object.keys(contact),
      tagDeliveryMode: resolvedTags.mode,
      listDeliveryMode: resolvedLists.mode,
    },
  };
}

export function buildFluentCrmLeadflowBody(input: FluentCrmUpsertInput): JsonObject {
  return buildFluentCrmLeadflowBodyWithDiagnostics(input).body;
}

export async function upsertLeadflowContact(input: FluentCrmUpsertInput): Promise<FluentCrmUpsertResult> {
  const webhookUrl = process.env.FLUENTCRM_CONTACT_WEBHOOK_URL;
  const webhookMissingOrPlaceholder = !webhookUrl || webhookUrl.includes('TU_HASH');

  if (webhookMissingOrPlaceholder) {
    const diagnostics = isJsonObject(input.payload)
      ? buildFluentCrmLeadflowBodyWithDiagnostics(input).diagnostics
      : undefined;

    warnFluentCrm('[leadflow-fluentcrm] webhook missing or placeholder', {
      configured: Boolean(webhookUrl),
      placeholder: Boolean(webhookUrl?.includes('TU_HASH')),
      tier: input.tier,
      evaluatedBy: input.evaluatedBy,
    });

    return {
      success: false,
      crmContactId: input.crmContactId ?? null,
      diagnostics,
      rawResponse: {
        error: webhookUrl ? 'FLUENTCRM_CONTACT_WEBHOOK_URL placeholder.' : 'FLUENTCRM_CONTACT_WEBHOOK_URL is not configured.',
      },
    };
  }

  const { body, diagnostics } = buildFluentCrmLeadflowBodyWithDiagnostics(input);
  const fields = isJsonObject(input.payload) ? extractPayloadFields(input.payload) : null;

  debugFluentCrm('[leadflow-fluentcrm] Upserting LeadFlow contact', {
    payloadMode: diagnostics.payloadMode,
    tagDeliveryMode: diagnostics.tagDeliveryMode,
    listDeliveryMode: diagnostics.listDeliveryMode,
    maskedEmail: maskEmail(fields?.email),
    maskedPhone: maskPhone(fields?.telefono),
    contactFields: diagnostics.nativeFieldKeys,
    customFields: diagnostics.customFieldKeys,
    nativeFields: diagnostics.nativeFieldKeys,
    tags: diagnostics.tagsSent,
    lists: diagnostics.listsSent,
    tier: input.tier,
    evaluatedBy: input.evaluatedBy,
  });

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  debugFluentCrm('[leadflow-fluentcrm] FluentCRM upsert response', {
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type') ?? '',
  });

  let rawResponse: unknown = null;
  let responseWasJson = false;

  try {
    rawResponse = await response.json();
    responseWasJson = true;
  } catch {
    rawResponse = await response.text().catch(() => null);
  }

  const responseDiagnostics: FluentCrmUpsertDiagnostics = {
    ...diagnostics,
    fluentStatus: response.status,
    fluentContentType: response.headers.get('content-type') ?? '',
    fluentResponseWasJson: responseWasJson,
  };

  debugFluentCrm('[leadflow-fluentcrm] FluentCRM response parsed', {
    status: response.status,
    contentType: responseDiagnostics.fluentContentType,
    responseWasJson,
  });

  if (!response.ok) {
    warnFluentCrm('[leadflow-fluentcrm] upsert failed', {
      status: response.status,
      responsePreview: responsePreview(rawResponse),
      tier: input.tier,
      evaluatedBy: input.evaluatedBy,
    });

    return {
      success: false,
      crmContactId: input.crmContactId ?? null,
      diagnostics: responseDiagnostics,
      rawResponse,
    };
  }

  debugFluentCrm('[leadflow-fluentcrm] upsert ok', {
    status: response.status,
    tier: input.tier,
    evaluatedBy: input.evaluatedBy,
  });

  return {
    success: true,
    crmContactId: findCrmContactId(rawResponse) ?? input.crmContactId ?? null,
    diagnostics: responseDiagnostics,
    rawResponse,
  };
}
