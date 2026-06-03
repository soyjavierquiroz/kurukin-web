import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { isIP } from 'node:net';
import { LeadStatus, Prisma, PrismaClient } from '@prisma/client';
import leadsHandler from './api/leads.ts';
import { upsertLeadflowContact } from './leadflow-fluentcrm.ts';

type CompatibleRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
};

type ApiHandler = (request: CompatibleRequest, response: ServerResponse) => Promise<void> | void;
type JsonObject = Record<string, unknown>;
type LeadflowTier = 'ORO' | 'PLATA' | 'DESCARTE';
type LeadflowTierCode = `KLF-${'A' | 'B' | 'C'}-${string}`;

const PORT = Number(process.env.API_PORT ?? 3001);
const LEADFLOW_N8N_TIMEOUT_MS = Number(process.env.LEADFLOW_N8N_TIMEOUT_MS ?? 30000);
const LEADFLOW_TIER_CODE_REGEX = /^KLF-[ABC]-[A-Z0-9]{6,12}$/;
const FORBIDDEN_TIER_CODE_SUFFIX_TERMS = ['MANUAL', 'DEV', 'TEST', 'LEADFLOW', 'MOCK'];
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));

function runHandler(handler: ApiHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request as CompatibleRequest, response)).catch(next);
  };
}

function sendJson(response: Response, statusCode: number, body: JsonObject) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(body));
}

function isLeadStatus(value: string): value is LeadStatus {
  return Object.values(LeadStatus).includes(value as LeadStatus);
}

function parseLeadStatus(value: unknown): LeadStatus | null {
  if (typeof value !== 'string') return null;

  const normalizedStatus = value.trim().toUpperCase();
  return isLeadStatus(normalizedStatus) ? normalizedStatus : null;
}

function asOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstUsefulItem(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.find((item) => isJsonObject(item)) ?? value[0];
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

function normalizeIp(value: unknown): string | undefined {
  const raw = asString(value);
  if (!raw) return undefined;

  let candidate = raw.trim().replace(/^"|"$/g, '');
  if (candidate.startsWith('::ffff:')) candidate = candidate.slice('::ffff:'.length);
  if (candidate.startsWith('[')) candidate = candidate.slice(1, candidate.indexOf(']') > 0 ? candidate.indexOf(']') : undefined);
  if (isIP(candidate)) return candidate;

  const ipv4WithPort = candidate.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4WithPort && isIP(ipv4WithPort[1])) return ipv4WithPort[1];

  return undefined;
}

function isPublicIpv4(ip: string): boolean {
  const octets = ip.split('.').map((part) => Number(part));
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;

  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 0 || b === 168)) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 192 && b === 0 && octets[2] === 2) return false;
  if (a === 198 && b === 51 && octets[2] === 100) return false;
  if (a === 203 && b === 0 && octets[2] === 113) return false;

  return true;
}

function isPublicIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::' || normalized === '::1') return false;

  const firstSegment = parseInt(normalized.split(':')[0] || '0', 16);
  if (!Number.isFinite(firstSegment)) return false;
  if ((firstSegment & 0xfe00) === 0xfc00) return false;
  if ((firstSegment & 0xffc0) === 0xfe80) return false;
  if ((firstSegment & 0xff00) === 0xff00) return false;
  if (normalized.startsWith('2001:db8:') || normalized === '2001:db8::') return false;

  return true;
}

function isPublicIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPublicIpv4(ip);
  if (version === 6) return isPublicIpv6(ip);

  return false;
}

function getHeaderIp(request: Request, headerName: string): string | undefined {
  return normalizeIp(request.get(headerName));
}

function getFirstPublicForwardedIp(request: Request): string | undefined {
  const forwardedFor = request.get('x-forwarded-for');
  if (!forwardedFor) return undefined;

  for (const item of forwardedFor.split(',')) {
    const ip = normalizeIp(item);
    if (ip && isPublicIp(ip)) return ip;
  }

  return undefined;
}

function getClientIp(request: Request): string | null {
  const cloudflareIp = getHeaderIp(request, 'cf-connecting-ip');
  if (cloudflareIp) return cloudflareIp;

  const forwardedIp = getFirstPublicForwardedIp(request);
  if (forwardedIp) return forwardedIp;

  return getHeaderIp(request, 'x-real-ip') ?? normalizeIp(request.ip) ?? normalizeIp(request.socket.remoteAddress) ?? null;
}

function getObject(value: unknown): JsonObject | undefined {
  return isJsonObject(value) ? value : undefined;
}

function parseJsonObject(value: unknown): JsonObject | undefined {
  const object = getObject(firstUsefulItem(value));
  if (object) return object;

  const text = asString(value);
  if (!text || (!text.startsWith('{') && !text.startsWith('['))) return undefined;

  try {
    return getObject(firstUsefulItem(JSON.parse(text) as unknown));
  } catch {
    return undefined;
  }
}

function toHumanLabel(value: unknown): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]') return '';

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        const parsedLabel = toHumanLabel(parsed);
        return parsedLabel || trimmed;
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) return toHumanLabel(firstUsefulItem(value));

  if (isJsonObject(value)) {
    return toHumanLabel(value.label) || toHumanLabel(value.value);
  }

  return '';
}

function getNestedString(object: JsonObject | undefined, path: string[]): string | undefined {
  let current: unknown = object;

  for (const key of path) {
    if (!isJsonObject(current)) return undefined;
    current = current[key];
  }

  return asString(current);
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = asString(value)?.toLowerCase();
  if (!normalized) return undefined;
  if (['true', '1', 'si', 'sí', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;

  return undefined;
}

function maskEmail(value: string | undefined): string {
  if (!value) return '';

  const [name = '', domain = ''] = value.split('@');
  if (!domain) return `${name.slice(0, 2)}***`;

  return `${name.slice(0, 2)}***@${domain}`;
}

function leadflowLog(message: string, details?: JsonObject) {
  console.info(message, details ?? {});
}

function leadflowWarn(message: string, details?: JsonObject) {
  console.warn(message, details ?? {});
}

function parseLeadflowStatus(value: unknown): LeadflowTier | undefined {
  const normalized = asString(value)
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  if (normalized === 'ORO') return 'ORO';
  if (normalized === 'PLATA') return 'PLATA';
  if (normalized === 'DESCARTE' || normalized === 'DESCARTADO' || normalized === 'RECHAZADO') return 'DESCARTE';

  return undefined;
}

function getTierCodePrefix(tier: LeadflowTier): `KLF-${'A' | 'B' | 'C'}` {
  const prefixByTier: Record<LeadflowTier, string> = {
    ORO: 'KLF-A',
    PLATA: 'KLF-B',
    DESCARTE: 'KLF-C',
  };

  return prefixByTier[tier] as `KLF-${'A' | 'B' | 'C'}`;
}

function isValidTierCode(value: unknown, tier?: LeadflowTier): value is LeadflowTierCode {
  const code = asString(value)?.toUpperCase();
  if (!code || !LEADFLOW_TIER_CODE_REGEX.test(code)) return false;
  if (tier && !code.startsWith(`${getTierCodePrefix(tier)}-`)) return false;

  const suffix = code.split('-').at(-1) ?? '';
  return !FORBIDDEN_TIER_CODE_SUFFIX_TERMS.some((term) => suffix.includes(term));
}

function buildTierCode(tier: LeadflowTier): LeadflowTierCode {
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  const tierCode = `${getTierCodePrefix(tier)}-${suffix}` as LeadflowTierCode;

  return isValidTierCode(tierCode, tier) ? tierCode : buildTierCode(tier);
}

function extractN8nTierCode(result: JsonObject): string | undefined {
  return (
    asString(result.tierCode) ??
    asString(result.tier_code) ??
    asString(result.codigoEvaluacion) ??
    asString(result.codigo_evaluacion) ??
    asString(getNestedString(result, ['leadflow', 'tierCode'])) ??
    asString(getNestedString(result, ['leadflow', 'tier_code']))
  )?.toUpperCase();
}

function resolveTierCode(tier: LeadflowTier, result: JsonObject): LeadflowTierCode {
  const n8nTierCode = extractN8nTierCode(result);
  if (isValidTierCode(n8nTierCode, tier)) return n8nTierCode;

  if (n8nTierCode) {
    leadflowWarn('[leadflow-evaluate] invalid n8n tierCode ignored', {
      tier,
      receivedPrefix: n8nTierCode.slice(0, 6),
    });
  }

  return buildTierCode(tier);
}

const FORBIDDEN_PUBLIC_TERMS = [
  /acceso\s+denegado/gi,
  /troll/gi,
  /basura/gi,
  /empleo\s+disfrazado/gi,
  /rechazad[oa]/gi,
  /descartad[oa]/gi,
  /descarte/gi,
  /no\s+viable/gi,
];

function sanitizePublicText(value: unknown): string {
  const rawText = asString(value) ?? '';
  const sanitized = FORBIDDEN_PUBLIC_TERMS.reduce((text, pattern) => text.replace(pattern, 'requiere una revisión más cuidadosa'), rawText)
    .replace(/\s{2,}/g, ' ')
    .trim();

  return sanitized;
}

function getDefaultPublicResultText(tier: LeadflowTier): string {
  if (tier === 'ORO') {
    return 'Tus respuestas muestran una estructura con señales claras para revisar la implementación de LeadFlow en una llamada.';
  }

  if (tier === 'PLATA') {
    return 'Tus respuestas muestran potencial, pero conviene validar algunos puntos de estructura antes de decidir la implementación completa.';
  }

  return 'Por tus respuestas, parece que LeadFlow todavía no es el siguiente movimiento principal para tu etapa actual. Eso no significa que estés fuera; significa que primero conviene identificar el paso más simple para aumentar volumen, equipo o cierre antes de implementar una infraestructura completa. Escríbenos por WhatsApp con tu código y te orientamos.';
}

function buildPublicResultText(tier: LeadflowTier, aiConsultingText?: string | null): string {
  if (tier === 'DESCARTE') return getDefaultPublicResultText(tier);

  const sanitizedAiText = sanitizePublicText(aiConsultingText);
  if (sanitizedAiText) return sanitizedAiText;

  return getDefaultPublicResultText(tier);
}

function extractLeadflowFields(payload: JsonObject) {
  const respuestas = getObject(payload.respuestas);
  const contacto = getObject(respuestas?.contacto);
  const analytics = getObject(payload.analytics);
  const nombre = asString(payload.nombre) ?? asString(payload.nombre_completo) ?? asString(contacto?.nombre_completo);
  const telefono = asString(payload.telefono) ?? asString(contacto?.whatsapp);
  const email = asString(payload.email) ?? asString(contacto?.email);
  const compania = toHumanLabel(payload.compania) || toHumanLabel(respuestas?.compania_producto);
  const eventId = asString(payload.eventId) ?? asString(analytics?.eventId);
  const tamanoEquipo = toHumanLabel(payload.tamanoEquipo) || toHumanLabel(respuestas?.tamano_equipo);

  return {
    respuestas,
    analytics,
    nombre,
    telefono,
    email,
    compania,
    eventId,
    tamanoEquipo,
  };
}

function extractLeadflowHumanFields(payload: JsonObject) {
  const respuestas = getObject(payload.respuestas);

  return {
    compania: toHumanLabel(payload.compania) || toHumanLabel(respuestas?.compania_producto),
    tamanoEquipo: toHumanLabel(payload.tamanoEquipo) || toHumanLabel(respuestas?.tamano_equipo),
    financiacion: toHumanLabel(payload.financiacion) || toHumanLabel(respuestas?.posicion_frente_a_inversion),
    tomaDecision: toHumanLabel(payload.tomaDecision) || toHumanLabel(respuestas?.decision_de_compra),
    origenLeads: toHumanLabel(payload.origenLeads) || toHumanLabel(payload.origenLeadsRaw) || toHumanLabel(respuestas?.inversion_ads),
    frenoDuplicacion:
      toHumanLabel(payload.frenoDuplicacion) || toHumanLabel(payload.frenoDuplicacionRaw) || toHumanLabel(respuestas?.principal_problema),
  };
}

function validateLeadflowPayload(payload: unknown, strict = true) {
  if (!isJsonObject(payload)) {
    throw new Error('Request body must be a JSON object.');
  }

  const fields = extractLeadflowFields(payload);
  const requiredFields = [
    ['nombre', fields.nombre],
    ['telefono', fields.telefono],
    ['email', fields.email],
    ['analytics.eventId', fields.eventId],
  ];

  if (strict) {
    requiredFields.push(['compania', fields.compania]);
  }

  const missingFields = requiredFields.filter(([, value]) => !value).map(([key]) => key);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}.`);
  }

  return {
    payload,
    ...fields,
    nombre: fields.nombre ?? '',
    telefono: fields.telefono ?? '',
    email: fields.email ?? '',
    compania: fields.compania ?? 'mi compañía',
    eventId: fields.eventId ?? randomUUID(),
    tamanoEquipo: fields.tamanoEquipo ?? 'mi equipo',
  };
}

function buildTrafficTag(payload: JsonObject) {
  const analytics = getObject(payload.analytics);
  const paidConfirmed = analytics?.paidConfirmed === true || asString(analytics?.paidConfirmed) === 'true';
  const paidPlatform = asString(analytics?.paidPlatform);
  const trafficType = asString(analytics?.trafficType);
  const hasMetaSignal = paidConfirmed && (paidPlatform === 'meta' || trafficType === 'meta_paid');
  const hasTikTokSignal = paidConfirmed && (paidPlatform === 'tiktok' || trafficType === 'tiktok_paid');

  return hasMetaSignal ? 'leadflow-meta' : hasTikTokSignal ? 'leadflow-tiktok' : 'leadflow-organico';
}

function buildLeadflowTags(payload: JsonObject, tier: LeadflowTier) {
  const tierTag = tier === 'ORO' ? 'leadflow-oro' : tier === 'PLATA' ? 'leadflow-plata' : 'leadflow-descarte';

  return ['leadflow', tierTag, buildTrafficTag(payload)];
}

function buildWhatsAppMessage({
  tier,
  nombre,
  compania,
  tamanoEquipo,
  tierCode,
}: {
  tier: LeadflowTier;
  nombre: string;
  compania: string;
  tamanoEquipo: string;
  tierCode: string;
}) {
  if (tier === 'ORO') {
    return [
      `Hola, soy ${nombre}. Deseo agendar una llamada para conocer LeadFlow para mi organización de multinivel en ${compania}.`,
      '',
      `Tengo un equipo de ${tamanoEquipo} y quiero revisar cómo implementar un sistema más duplicable para captar y convertir prospectos.`,
      '',
      `Mi código de evaluación es: ${tierCode}`,
    ].join('\n');
  }

  if (tier === 'PLATA') {
    return [
      `Hola, soy ${nombre}. Deseo agendar una llamada para conocer LeadFlow para mi organización de multinivel en ${compania}.`,
      '',
      'Quiero validar si mi estructura actual está lista para implementar LeadFlow y qué tendría que preparar para hacerlo correctamente.',
      '',
      `Mi código de evaluación es: ${tierCode}`,
    ].join('\n');
  }

  return [
    `Hola, soy ${nombre}. Vengo de la evaluación LeadFlow para mi organización de multinivel en ${compania}.`,
    '',
    'Quiero saber cuál es el siguiente paso recomendado para mi etapa actual.',
    '',
    `Mi código de evaluación es: ${tierCode}`,
  ].join('\n');
}

function buildLeadflowResponse({
  payload,
  n8nResult,
  forcedTier,
  crmContactId,
}: {
  payload: JsonObject;
  n8nResult?: unknown;
  forcedTier?: LeadflowTier;
  crmContactId?: string | null;
}) {
  const fields = validateLeadflowPayload(payload, false);
  const result = extractN8nEvaluationResult(n8nResult);
  const esValido = asBoolean(result.es_valido) ?? asBoolean(result.esValido) ?? asBoolean(result.is_valid) ?? asBoolean(result.isValid);
  const rawStatus =
    asString(result.status) ??
    asString(result.clasificacion) ??
    asString(result.classification) ??
    asString(result.final_status);
  const tier = forcedTier ?? (esValido === false ? 'DESCARTE' : parseLeadflowStatus(rawStatus)) ?? 'DESCARTE';
  const tierCode = resolveTierCode(tier, result);
  const aiConsultingText =
    sanitizePublicText(result.ai_consulting_text) ||
    sanitizePublicText(result.aiConsultingText) ||
    sanitizePublicText(result.aiConsultingTextPublic);
  const publicResultText = buildPublicResultText(tier, aiConsultingText);
  const whatsappMessage = buildWhatsAppMessage({
    tier,
    nombre: fields.nombre,
    compania: fields.compania,
    tamanoEquipo: fields.tamanoEquipo,
    tierCode,
  });

  return {
    success: true,
    status: tier,
    clasificacion: getPublicClassification(tier),
    esValido: tier === 'ORO' || tier === 'PLATA',
    rawStatus,
    isQualified: tier === 'ORO' || tier === 'PLATA',
    tierCode,
    aiConsultingText: tier === 'DESCARTE' ? '' : aiConsultingText || publicResultText,
    publicResultText,
    dolorPsicologico: getNestedString(result, ['analisis_interno', 'dolor_psicologico']) ?? asString(result.dolorPsicologico) ?? null,
    estrategiaCierre: getNestedString(result, ['analisis_interno', 'estrategia_cierre']) ?? asString(result.estrategiaCierre) ?? null,
    crmContactId: crmContactId ?? asString(result.crmContactId) ?? asString(result.crm_contact_id) ?? null,
    whatsappMessage,
  };
}

function getPublicClassification(tier: LeadflowTier): string {
  if (tier === 'ORO') return 'Oro';
  if (tier === 'PLATA') return 'Plata';

  return 'Descarte';
}

function extractN8nEvaluationResult(value: unknown): JsonObject {
  const object = parseJsonObject(value) ?? {};

  for (const key of ['json', 'body', 'data', 'result', 'output']) {
    const nested = parseJsonObject(object[key]);
    if (nested) return nested;
  }

  return object;
}

function hasN8nClassification(value: unknown): boolean {
  const result = extractN8nEvaluationResult(value);
  const rawStatus =
    asString(result.status) ??
    asString(result.clasificacion) ??
    asString(result.classification) ??
    asString(result.final_status);
  const esValido = asBoolean(result.es_valido) ?? asBoolean(result.esValido) ?? asBoolean(result.is_valid) ?? asBoolean(result.isValid);

  return Boolean(parseLeadflowStatus(rawStatus) || esValido === false);
}

function didN8nWorkflowSucceed(value: unknown): boolean {
  const result = extractN8nEvaluationResult(value);

  return asBoolean(result.success) !== false;
}

function buildN8nPayload(payload: JsonObject, tier?: LeadflowTier): JsonObject {
  const lead = extractLeadflowHumanFields(payload);
  const respuestas = getObject(payload.respuestas);

  return {
    ...payload,
    compania: lead.compania,
    tamanoEquipo: lead.tamanoEquipo,
    financiacion: lead.financiacion,
    tomaDecision: lead.tomaDecision,
    origenLeads: lead.origenLeads,
    frenoDuplicacion: lead.frenoDuplicacion,
    respuestas: respuestas
      ? {
          ...respuestas,
          compania_producto: lead.compania,
          tamano_equipo: lead.tamanoEquipo,
          inversion_ads: lead.origenLeads,
          posicion_frente_a_inversion: lead.financiacion,
          decision_de_compra: lead.tomaDecision,
          principal_problema: lead.frenoDuplicacion,
        }
      : payload.respuestas,
    lead,
    source: 'leadflow',
    leadflow: {
      source: 'leadflow',
      status: tier,
      tags: tier ? buildLeadflowTags(payload, tier) : ['leadflow', buildTrafficTag(payload)],
    },
  };
}

function withAnalyticsClientIp(payload: JsonObject, clientIp: string | null): JsonObject {
  const analytics = getObject(payload.analytics) ?? {};

  return {
    ...payload,
    analytics: {
      ...analytics,
      clientIp,
      client_ip: clientIp,
    },
  };
}

function isLocalGuillotinePayload(payload: JsonObject): boolean {
  const lead = extractLeadflowHumanFields(payload);
  const normalizedTeamSize = `${lead.tamanoEquipo} ${JSON.stringify(getObject(payload.respuestas)?.tamano_equipo ?? '')}`;
  const normalizedProblem = lead.frenoDuplicacion;
  const normalizedFinancing = `${lead.financiacion} ${JSON.stringify(getObject(payload.respuestas)?.posicion_frente_a_inversion ?? '')}`;

  return (
    normalizedTeamSize.includes('Menos de 15') ||
    normalizedTeamSize.includes('less_than_15') ||
    normalizedProblem.includes('Recién empiezo') ||
    normalizedProblem.includes('Recien empiezo') ||
    normalizedFinancing.includes('No cuento con más de $100') ||
    normalizedFinancing.includes('no_budget')
  );
}

function getLocalDiscardReason(payload: JsonObject): string {
  const respuestas = getObject(payload.respuestas);
  const teamSize = JSON.stringify(respuestas?.tamano_equipo ?? payload.tamanoEquipo ?? '');
  const mainProblem = asString(respuestas?.principal_problema) ?? asString(payload.frenoDuplicacionRaw) ?? '';
  const financing = JSON.stringify(respuestas?.posicion_frente_a_inversion ?? payload.financiacion ?? '');

  if (teamSize.includes('Menos de 15') || teamSize.includes('less_than_15')) return 'menos_15';
  if (mainProblem.includes('Recién empiezo') || mainProblem.includes('Recien empiezo')) return 'recien_empieza';
  if (financing.includes('No cuento con más de $100') || financing.includes('no_budget')) return 'sin_presupuesto';

  return 'guillotina_local';
}

function isClearlyGoodLead(payload: JsonObject): boolean {
  const lead = extractLeadflowHumanFields(payload);
  const teamSize = lead.tamanoEquipo.toLowerCase();
  const financing = lead.financiacion.toLowerCase();
  const decision = lead.tomaDecision.toLowerCase();

  const hasQualifiedTeam = teamSize.includes('15 a 50') || teamSize.includes('entre 15 y 50') || teamSize.includes('más de 50') || teamSize.includes('mas de 50') || teamSize.includes('more_than_50');
  const hasQualifiedFunding =
    financing.includes('capital listo') ||
    financing.includes('capital_ready') ||
    financing.includes('co-invers') ||
    financing.includes('co-inversión') ||
    financing.includes('vaca') ||
    financing.includes('team_pool');
  const ownsDecision = decision.includes('decisión propia') || decision.includes('decision propia') || decision.includes('100% de mí') || decision.includes('100% de mi') || decision === 'yes';

  return hasQualifiedTeam && hasQualifiedFunding && ownsDecision && lead.compania.length > 0;
}

function hasSuspiciousDiscardReason(responseBody: ReturnType<typeof buildLeadflowResponse>): boolean {
  const reasonText = [
    responseBody.rawStatus,
    responseBody.publicResultText,
    responseBody.dolorPsicologico,
    responseBody.estrategiaCierre,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /no se detecta.*(equipo|capital)|no.*(equipo|capital)|sin.*(equipo|capital)/i.test(reasonText);
}

async function evaluateLeadflow(request: Request, response: Response, next: NextFunction) {
  try {
    const { payload, eventId, email } = validateLeadflowPayload(request.body);
    const lead = extractLeadflowHumanFields(payload);
    const passedGuillotine = !isLocalGuillotinePayload(payload);

    leadflowLog('[leadflow-evaluate] received', {
      email: maskEmail(email),
      company: lead.compania,
      teamSize: lead.tamanoEquipo,
      financing: lead.financiacion,
      decision: lead.tomaDecision,
      eventIdExists: Boolean(eventId),
      passedGuillotine,
    });

    const pendingTierCode = buildTierCode('DESCARTE');
    leadflowLog('[leadflow-evaluate] FluentCRM initial upsert', {
      attempted: true,
    });
    const pendingCrmUpsert = await upsertLeadflowContact({
      payload,
      tier: 'PENDIENTE',
      tierCode: pendingTierCode,
      evaluatedBy: 'pending',
    });

    if (!pendingCrmUpsert.success) {
      leadflowWarn('[leadflow-evaluate] FluentCRM initial upsert failed', {
        reason: 'crm_pending_upsert_failed',
        status: pendingCrmUpsert.diagnostics?.fluentStatus ?? null,
      });
    } else {
      leadflowLog('[leadflow-evaluate] FluentCRM initial upsert ok', {
        status: pendingCrmUpsert.diagnostics?.fluentStatus ?? null,
        crmContactIdExists: Boolean(pendingCrmUpsert.crmContactId),
      });
    }

    const sendManualReviewResponse = async (discardReason: string) => {
      const manualResponse = buildLeadflowResponse({
        payload,
        forcedTier: 'DESCARTE',
        crmContactId: pendingCrmUpsert.crmContactId,
      });
      leadflowLog('[leadflow-evaluate] FluentCRM final upsert', {
        attempted: true,
        tier: manualResponse.status,
        evaluatedBy: 'pending',
      });
      const manualCrmUpsert = await upsertLeadflowContact({
        payload,
        tier: 'DESCARTE',
        tierCode: manualResponse.tierCode,
        evaluatedBy: 'pending',
        discardReason,
        crmContactId: pendingCrmUpsert.crmContactId,
      });

      if (!manualCrmUpsert.success) {
        leadflowWarn('[leadflow-evaluate] FluentCRM final upsert failed', {
          reason: 'crm_manual_review_upsert_failed',
          status: manualCrmUpsert.diagnostics?.fluentStatus ?? null,
        });
      }

      leadflowLog('[leadflow-evaluate] final response', {
        tierCode: manualResponse.tierCode,
        isQualified: manualResponse.isQualified,
        crmContactId: manualCrmUpsert.crmContactId ?? manualResponse.crmContactId,
      });
      sendJson(response, 200, {
        ...manualResponse,
        crmContactId: manualCrmUpsert.crmContactId ?? manualResponse.crmContactId,
      });
    };

    const webhookUrl = process.env.N8N_LEADFLOW_EVALUATE_WEBHOOK_URL;
    const clientIp = getClientIp(request);
    const n8nPayload = buildN8nPayload(
      withAnalyticsClientIp(
        {
          ...payload,
          crmContactId: pendingCrmUpsert.crmContactId,
          tierCode: pendingTierCode,
        },
        clientIp,
      ),
    );

    leadflowLog('[leadflow-evaluate] sending to n8n', {
      n8nConfigured: Boolean(webhookUrl),
      leadKeys: Object.keys(extractLeadflowHumanFields(payload)),
      lead: extractLeadflowHumanFields(n8nPayload),
      clientIpCaptured: Boolean(clientIp),
      clientIpVersion: clientIp ? isIP(clientIp) : null,
      analyticsClientIpForwarded: Boolean(getObject(n8nPayload.analytics)?.clientIp || getObject(n8nPayload.analytics)?.client_ip),
    });

    if (!webhookUrl) {
      leadflowWarn('[leadflow-evaluate] n8n evaluate webhook is not configured after CRM pending capture', {
        reason: 'n8n_webhook_missing',
      });
      await sendManualReviewResponse('scoring_webhook_missing');
      return;
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
    }, LEADFLOW_N8N_TIMEOUT_MS);
    let n8nResponse: globalThis.Response;

    try {
      n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify(n8nPayload),
      });
    } catch (error) {
      clearTimeout(timeout);
      leadflowWarn('[leadflow-evaluate] n8n evaluate webhook request failed after CRM pending capture', {
        reason: error instanceof Error ? error.name : 'n8n_request_failed',
      });
      await sendManualReviewResponse('scoring_request_failed');
      return;
    } finally {
      clearTimeout(timeout);
    }

    if (!n8nResponse.ok) {
      leadflowWarn('[leadflow-evaluate] n8n evaluate webhook returned non-OK status', { status: n8nResponse.status });
      await sendManualReviewResponse('scoring_http_error');
      return;
    }

    let n8nResult: unknown;

    try {
      n8nResult = (await n8nResponse.json()) as unknown;
    } catch {
      leadflowWarn('[leadflow-evaluate] n8n evaluate webhook returned invalid JSON', {
        reason: 'n8n_invalid_json',
      });
      await sendManualReviewResponse('scoring_invalid_json');
      return;
    }

    if (!didN8nWorkflowSucceed(n8nResult) || !hasN8nClassification(n8nResult)) {
      leadflowWarn('[leadflow-evaluate] n8n evaluate webhook returned an unusable evaluation contract', {
        reason: !didN8nWorkflowSucceed(n8nResult) ? 'n8n_contract_success_false' : 'n8n_contract_missing_classification',
      });
      await sendManualReviewResponse('scoring_invalid_contract');
      return;
    }

    const normalizedResponse = buildLeadflowResponse({
      payload,
      n8nResult,
      crmContactId: pendingCrmUpsert.crmContactId,
    });
    leadflowLog('[leadflow-evaluate] n8n normalized', {
      rawStatus: normalizedResponse.rawStatus ?? null,
      status: normalizedResponse.status,
      tier: normalizedResponse.status,
      esValido: normalizedResponse.esValido,
      isQualified: normalizedResponse.isQualified,
      aiTextExists: Boolean(normalizedResponse.aiConsultingText || normalizedResponse.publicResultText),
    });

    if (normalizedResponse.status === 'DESCARTE' && isClearlyGoodLead(payload) && hasSuspiciousDiscardReason(normalizedResponse)) {
      leadflowWarn('[leadflow-evaluate] suspicious n8n discard', {
        rawStatus: normalizedResponse.rawStatus ?? null,
        teamSize: lead.tamanoEquipo,
        financing: lead.financiacion,
        decision: lead.tomaDecision,
        companyExists: Boolean(lead.compania),
      });
    }

    leadflowLog('[leadflow-evaluate] FluentCRM final upsert', {
      attempted: true,
      tier: normalizedResponse.status,
      evaluatedBy: 'ia',
    });
    const finalCrmUpsert = await upsertLeadflowContact({
      payload,
      tier: normalizedResponse.status,
      tierCode: normalizedResponse.tierCode,
      evaluatedBy: 'ia',
      discardReason: normalizedResponse.status === 'DESCARTE' ? normalizedResponse.rawStatus ?? 'ai_discard' : null,
      aiConsultingText: normalizedResponse.aiConsultingText || normalizedResponse.publicResultText,
      dolorPsicologico: normalizedResponse.dolorPsicologico,
      estrategiaCierre: normalizedResponse.estrategiaCierre,
      crmContactId: normalizedResponse.crmContactId,
    });

    if (!finalCrmUpsert.success) {
      leadflowWarn('[leadflow-evaluate] FluentCRM final upsert failed', {
        reason: 'crm_final_upsert_failed',
        status: finalCrmUpsert.diagnostics?.fluentStatus ?? null,
      });
    } else {
      leadflowLog('[leadflow-evaluate] FluentCRM final upsert ok', {
        status: finalCrmUpsert.diagnostics?.fluentStatus ?? null,
        crmContactIdExists: Boolean(finalCrmUpsert.crmContactId),
      });
    }

    leadflowLog('[leadflow-evaluate] final response', {
      tierCode: normalizedResponse.tierCode,
      isQualified: normalizedResponse.isQualified,
      crmContactId: finalCrmUpsert.crmContactId ?? normalizedResponse.crmContactId,
    });
    sendJson(response, 200, {
      ...normalizedResponse,
      crmContactId: finalCrmUpsert.crmContactId ?? normalizedResponse.crmContactId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Missing required fields')) {
      sendJson(response, 400, {
        success: false,
        error: error.message,
      });
      return;
    }

    next(error);
  }
}

async function captureLocalLeadflowDiscard(request: Request, response: Response, next: NextFunction) {
  try {
    const { payload } = validateLeadflowPayload(request.body, false);
    const normalizedResponse = buildLeadflowResponse({
      payload,
      forcedTier: 'DESCARTE',
    });
    leadflowLog('[leadflow-evaluate] FluentCRM final upsert', {
      attempted: true,
      tier: 'DESCARTE_LOCAL',
      evaluatedBy: 'local',
    });
    const localDiscardCrmUpsert = await upsertLeadflowContact({
      payload,
      tier: 'DESCARTE_LOCAL',
      tierCode: normalizedResponse.tierCode,
      evaluatedBy: 'local',
      discardReason: getLocalDiscardReason(payload),
    });

    if (!localDiscardCrmUpsert.success) {
      leadflowWarn('[leadflow-evaluate] FluentCRM final upsert failed', {
        reason: 'crm_local_discard_upsert_failed',
        status: localDiscardCrmUpsert.diagnostics?.fluentStatus ?? null,
      });
    } else {
      leadflowLog('[leadflow-evaluate] FluentCRM final upsert ok', {
        status: localDiscardCrmUpsert.diagnostics?.fluentStatus ?? null,
        crmContactIdExists: Boolean(localDiscardCrmUpsert.crmContactId),
      });
    }

    leadflowLog('[leadflow-evaluate] final response', {
      tierCode: normalizedResponse.tierCode,
      isQualified: normalizedResponse.isQualified,
      crmContactId: localDiscardCrmUpsert.crmContactId ?? normalizedResponse.crmContactId,
    });
    sendJson(response, 200, {
      ...normalizedResponse,
      crmContactId: localDiscardCrmUpsert.crmContactId ?? normalizedResponse.crmContactId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Missing required fields')) {
      sendJson(response, 400, {
        success: false,
        error: error.message,
      });
      return;
    }

    next(error);
  }
}

function buildDevFluentCrmFixture(overrides: unknown): JsonObject {
  const timestamp = Date.now();
  const overridePayload = isJsonObject(overrides) ? overrides : {};

  return {
    nombre: 'LeadFlow Test',
    telefono: '+59170000000',
    email: `leadflow-test+${timestamp}@kurukin.test`,
    pais: 'Bolivia',
    city: 'Santa Cruz',
    state: 'Santa Cruz',
    compania: 'Herbalife',
    tamanoEquipo: '15 a 50 personas',
    origenLeadsRaw: 'Tráfico pago sin cierre',
    frenoDuplicacionRaw: 'Dependen de mí para presentar y cerrar.',
    financiacion: 'Capital listo',
    tomaDecision: 'Decisión propia',
    analytics: {
      eventId: `dev-test-${timestamp}`,
      fbp: 'fbp-dev-test',
      fbc: 'fbc-dev-test',
      ttclid: '',
      ttp: '',
    },
    ...overridePayload,
  };
}

async function testFluentCrmLeadflow(request: Request, response: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    sendJson(response, 404, {
      success: false,
      error: 'Not found',
    });
    return;
  }

  try {
    const payload = buildDevFluentCrmFixture(request.body);
    const upsertResult = await upsertLeadflowContact({
      payload,
      tier: 'ORO',
      tierCode: buildTierCode('ORO'),
      evaluatedBy: 'ia',
      aiConsultingText: 'Diagnóstico de prueba LeadFlow',
      dolorPsicologico: 'Dolor de prueba',
      estrategiaCierre: 'Estrategia de prueba',
    });

    const diagnostics = upsertResult.diagnostics;

    if (!upsertResult.success) {
      const rawResponse = getObject(upsertResult.rawResponse);
      const error =
        asString(rawResponse?.error) === 'FLUENTCRM_CONTACT_WEBHOOK_URL is not configured.'
          ? 'FLUENTCRM_CONTACT_WEBHOOK_URL is not configured'
          : 'FluentCRM test upsert failed';

      sendJson(response, error === 'FLUENTCRM_CONTACT_WEBHOOK_URL is not configured' ? 503 : 502, {
        success: false,
        error,
        payloadMode: diagnostics?.payloadMode ?? 'hybrid',
        tagsSent: diagnostics?.tagsSent ?? [],
        listsSent: diagnostics?.listsSent ?? [],
        customFieldKeys: diagnostics?.customFieldKeys ?? [],
        nativeFieldKeys: diagnostics?.nativeFieldKeys ?? [],
        fluentStatus: diagnostics?.fluentStatus ?? null,
        fluentContentType: diagnostics?.fluentContentType ?? null,
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      crmContactId: upsertResult.crmContactId,
      payloadMode: diagnostics?.payloadMode ?? 'hybrid',
      tagsSent: diagnostics?.tagsSent ?? [],
      listsSent: diagnostics?.listsSent ?? [],
      customFieldKeys: diagnostics?.customFieldKeys ?? [],
      nativeFieldKeys: diagnostics?.nativeFieldKeys ?? [],
      fluentStatus: diagnostics?.fluentStatus ?? null,
      fluentContentType: diagnostics?.fluentContentType ?? null,
    });
  } catch (error) {
    next(error);
  }
}

async function getLeadStatus(request: Request<{ id: string }>, response: Response, next: NextFunction) {
  try {
    const lead = await prisma.lead.findUnique({
      where: {
        id: request.params.id,
      },
      select: {
        status: true,
        aiConsultingText: true,
        dolorPsicologico: true,
        estrategiaCierre: true,
      },
    });

    if (!lead) {
      sendJson(response, 404, {
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      ...lead,
    });
  } catch (error) {
    next(error);
  }
}

async function patchLeadStatus(request: Request<{ id: string }>, response: Response, next: NextFunction) {
  try {
    const status = parseLeadStatus(request.body?.status);

    if (!status) {
      sendJson(response, 400, {
        success: false,
        error: 'Invalid status. Expected PENDIENTE, ORO, PLATA, TROLL or BASURA.',
      });
      return;
    }

    await prisma.lead.update({
      where: {
        id: request.params.id,
      },
      data: {
        status,
        aiConsultingText: asOptionalText(request.body?.aiConsultingText),
        dolorPsicologico: asOptionalText(request.body?.dolorPsicologico),
        estrategiaCierre: asOptionalText(request.body?.estrategiaCierre),
      },
    });

    sendJson(response, 200, {
      success: true,
      message: 'Lead updated successfully',
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      sendJson(response, 404, {
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    next(error);
  }
}

app.post('/api/leads', runHandler(leadsHandler));
app.get('/api/leads/:id/status', getLeadStatus);
app.patch('/api/leads/:id/status', patchLeadStatus);
app.post('/api/leadflow/evaluate', evaluateLeadflow);
app.post('/api/leadflow/capture-local-discard', captureLocalLeadflowDiscard);
app.post('/api/leadflow/dev/test-fluentcrm', testFluentCrmLeadflow);

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  void _next;
  console.error('[server-api] Unhandled API error', error);

  if (response.headersSent) {
    return;
  }

  response.status(500).json({
    success: false,
    error: 'Internal API server error',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server-api] Listening on http://0.0.0.0:${PORT}`);
});
