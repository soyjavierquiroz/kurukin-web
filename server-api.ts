import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { LeadStatus, Prisma, PrismaClient } from '@prisma/client';
import leadsHandler from './api/leads.ts';

type CompatibleRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
};

type ApiHandler = (request: CompatibleRequest, response: ServerResponse) => Promise<void> | void;
type JsonObject = Record<string, unknown>;

const PORT = Number(process.env.API_PORT ?? 3001);
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

const app = express();

app.disable('x-powered-by');
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
