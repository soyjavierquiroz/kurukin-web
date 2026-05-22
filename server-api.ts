import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import leadsHandler from './api/leads.ts';
import leadStatusHandler from './api/leads/[id]/status.ts';

type CompatibleRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
  query?: {
    id?: string | string[];
  };
};

type ApiHandler = (request: CompatibleRequest, response: ServerResponse) => Promise<void> | void;

const PORT = Number(process.env.API_PORT ?? 3001);

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function runHandler(handler: ApiHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request as CompatibleRequest, response)).catch(next);
  };
}

function runStatusHandler(request: Request<{ id: string }>, response: Response, next: NextFunction) {
  const compatibleRequest = request as Request<{ id: string }> & CompatibleRequest;
  compatibleRequest.query = {
    id: request.params.id,
  };

  Promise.resolve(leadStatusHandler(compatibleRequest, response)).catch(next);
}

app.post('/api/leads', runHandler(leadsHandler));
app.get('/api/leads/:id/status', runStatusHandler);
app.patch('/api/leads/:id/status', runStatusHandler);

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
