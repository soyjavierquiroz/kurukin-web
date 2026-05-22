import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';
import { PrismaClient } from '@prisma/client';

type JsonObject = Record<string, unknown>;

type ApiRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
};

type LeadInput = {
  nombre: string;
  telefono: string;
  email: string;
  pais?: string;
  compania?: string;
  tamanoEquipo?: string;
  origenLeadsRaw?: string;
  frenoDuplicacionRaw?: string;
  financiacion?: string;
  tomaDecision?: string;
  eventId?: string;
};

class BadRequestError extends Error {}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

function sendJson(response: ServerResponse, statusCode: number, body: JsonObject) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function asRawString(value: unknown): string | undefined {
  const primitive = asString(value);
  if (primitive) return primitive;

  if (value === undefined || value === null) return undefined;

  return JSON.stringify(value);
}

function getObject(value: unknown): JsonObject | undefined {
  return isJsonObject(value) ? value : undefined;
}

function getOptionLabel(value: unknown): string | undefined {
  const objectValue = getObject(value);
  return asString(objectValue?.label) ?? asString(objectValue?.value) ?? asRawString(value);
}

async function readBody(request: ApiRequest): Promise<unknown> {
  if (request.body !== undefined) {
    if (typeof request.body === 'string') return JSON.parse(request.body);
    return request.body;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function normalizeLeadInput(payload: JsonObject): LeadInput {
  const respuestas = getObject(payload.respuestas);
  const contacto = getObject(respuestas?.contacto);
  const pais = getObject(contacto?.pais);

  const nombre = asString(payload.nombre) ?? asString(payload.nombre_completo) ?? asString(contacto?.nombre_completo);
  const telefono = asString(payload.telefono) ?? asString(contacto?.whatsapp);
  const email = asString(payload.email) ?? asString(contacto?.email);

  if (!nombre || !telefono || !email) {
    throw new BadRequestError('Missing required lead fields: nombre, telefono and email are required.');
  }

  return {
    nombre,
    telefono,
    email,
    pais: asString(payload.pais) ?? asString(pais?.label) ?? asString(pais?.code),
    compania: asString(payload.compania) ?? asString(respuestas?.compania_producto),
    tamanoEquipo: asRawString(payload.tamanoEquipo) ?? getOptionLabel(respuestas?.tamano_equipo),
    origenLeadsRaw: asRawString(payload.origenLeadsRaw) ?? asRawString(respuestas?.inversion_ads),
    frenoDuplicacionRaw: asRawString(payload.frenoDuplicacionRaw) ?? asString(respuestas?.principal_problema),
    financiacion:
      asRawString(payload.financiacion) ?? asRawString(respuestas?.posicion_frente_a_inversion),
    tomaDecision: asRawString(payload.tomaDecision) ?? asRawString(respuestas?.decision_de_compra),
    eventId: asString(payload.eventId) ?? asString(getObject(payload.analytics)?.eventId),
  };
}

function dispatchToN8n(payload: JsonObject, localLeadId: string) {
  const webhookUrl = process.env.N8N_LEAD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[api/leads] N8N_LEAD_WEBHOOK_URL is not configured. Lead stored locally only.', {
      localLeadId,
    });
    return;
  }

  const n8nPayload = {
    ...payload,
    localLeadId,
  };

  void fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(n8nPayload),
  }).catch((error) => {
    console.error('[api/leads] n8n webhook dispatch failed', {
      localLeadId,
      error,
    });
  });
}

export default async function handler(request: ApiRequest, response: ServerResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, {
      success: false,
      error: 'Method not allowed',
    });
    return;
  }

  try {
    const body = await readBody(request);

    if (!isJsonObject(body)) {
      throw new BadRequestError('Request body must be a JSON object');
    }

    const leadInput = normalizeLeadInput(body);
    const lead = await prisma.lead.create({
      data: leadInput,
      select: {
        id: true,
      },
    });
    const localLeadId = lead.id;

    dispatchToN8n(body, localLeadId);

    sendJson(response, 201, {
      success: true,
      localLeadId,
    });
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof SyntaxError) {
      sendJson(response, 400, {
        success: false,
        error: error.message,
      });
      return;
    }

    console.error('[api/leads] Lead creation failed', error);

    sendJson(response, 500, {
      success: false,
      error: 'Lead could not be stored',
    });
  }
}
