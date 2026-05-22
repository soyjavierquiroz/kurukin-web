import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';
import { LeadStatus, Prisma, PrismaClient } from '@prisma/client';

type JsonObject = Record<string, unknown>;

type ApiRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
  query?: {
    id?: string | string[];
  };
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
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
}

function readIdFromUrl(request: ApiRequest): string | undefined {
  const queryId = request.query?.id;

  if (Array.isArray(queryId)) return queryId[0];
  if (queryId) return queryId;
  if (!request.url) return undefined;

  const pathname = new URL(request.url, 'http://localhost').pathname;
  const match = pathname.match(/^\/api\/leads\/([^/]+)\/status\/?$/);
  return match ? decodeURIComponent(match[1]) : undefined;
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

function isLeadStatus(value: string): value is LeadStatus {
  return Object.values(LeadStatus).includes(value as LeadStatus);
}

function parseLeadStatus(value: unknown): LeadStatus {
  const normalizedStatus = asString(value)?.toUpperCase();

  if (!normalizedStatus || !isLeadStatus(normalizedStatus)) {
    throw new BadRequestError('Invalid status. Expected PENDIENTE, ORO, PLATA, TROLL or BASURA.');
  }

  return normalizedStatus;
}

export default async function handler(request: ApiRequest, response: ServerResponse) {
  if (request.method !== 'GET' && request.method !== 'PATCH') {
    response.setHeader('Allow', 'GET, PATCH');
    sendJson(response, 405, {
      success: false,
      error: 'Method not allowed',
    });
    return;
  }

  try {
    const id = readIdFromUrl(request);

    if (!id) {
      throw new BadRequestError('Lead id is required in the URL.');
    }

    if (request.method === 'GET') {
      const lead = await prisma.lead.findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          status: true,
          aiConsultingText: true,
          dolorPsicologico: true,
          estrategiaCierre: true,
        },
      });

      sendJson(response, 200, {
        success: true,
        ...lead,
      });
      return;
    }

    const body = await readBody(request);

    if (!isJsonObject(body)) {
      throw new BadRequestError('Request body must be a JSON object.');
    }

    await prisma.lead.update({
      where: {
        id,
      },
      data: {
        status: parseLeadStatus(body.status),
        aiConsultingText: asOptionalText(body.aiConsultingText),
        dolorPsicologico: asOptionalText(body.dolorPsicologico),
        estrategiaCierre: asOptionalText(body.estrategiaCierre),
      },
    });

    sendJson(response, 200, {
      success: true,
      message: 'Lead updated successfully',
    });
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof SyntaxError) {
      sendJson(response, 400, {
        success: false,
        error: error.message,
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      sendJson(response, 404, {
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    console.error('[api/leads/:id/status] Lead update failed', error);

    sendJson(response, 500, {
      success: false,
      error: 'Lead could not be updated',
    });
  }
}
