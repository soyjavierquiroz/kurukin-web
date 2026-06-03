# Kurukin

App principal de Kurukin montada con Vite + React + TypeScript.

## Demo del reproductor

La página de demostración vive en `src/pages/DemoPage.tsx`.

Actualmente expone dos escenarios:

- YouTube con `provider="youtube"` y `videoId="aQhTmuZiKOY"`.
- Bunny HLS con `provider="bunnynet"` usando el manifiesto `.m3u8`.

Ambos demos consumen la API premium del reproductor con `vslMode`, `resumePlayback` y `onTimeUpdate`.

## Scripts útiles

- `npm run dev`
- `npm run build`
- `npm run typecheck`

## Arquitectura LeadFlow actual

LeadFlow esta operativo sin Prisma ni DB local en el flujo vivo. Prisma y los endpoints antiguos pueden seguir en el repo como capa legacy temporal, pero no forman parte del runtime comercial actual.

```text
React LeadFlow
-> /api/leadflow/evaluate en kurukin_api
-> FluentCRM initial upsert
-> n8n scoring sincrono
-> FluentCRM final upsert
-> React resultado
-> WhatsApp
-> Meta CAPI solo para ORO/PLATA desde n8n
```

Para descarte por guillotina local, React llama `POST /api/leadflow/capture-local-discard`; el backend registra el contacto como descarte local en FluentCRM y no llama a n8n ni dispara conversion publicitaria.

## Servicios Docker Swarm

```text
kurukin-web_kurukin_web = Nginx estatico React + proxy /api
kurukin-web_kurukin_api = Node/tsx backend API
n8n_n8n_v2_webhook = webhook interno n8n
crm.kurukin.com = WordPress + FluentCRM externo
```

`kurukin_web` sirve el build React por Nginx y proxyea `/api/` hacia `kurukin_api:3001`. `kurukin_api` corre dentro de Docker Swarm y llama al webhook interno de n8n.

## Redes Docker

```text
kurukin_api y n8n comparten general_network
kurukin_web usa traefik_public + general_network
URL interna n8n: http://n8n_v2_webhook:5678/webhook/leadflow-eval
```

## Endpoints vivos

```text
POST /api/leadflow/evaluate
POST /api/leadflow/capture-local-discard
```

`POST /api/leadflow/evaluate` recibe el payload completo del formulario, valida contacto y `analytics.eventId`, hace upsert inicial en FluentCRM, llama a n8n, normaliza la respuesta, hace upsert final y responde al frontend.

`POST /api/leadflow/capture-local-discard` recibe el payload completo del formulario, no llama a n8n, guarda/actualiza el contacto en FluentCRM como descarte local y devuelve resultado publico `DESCARTE` con WhatsApp.

## Endpoints legacy

```text
POST /api/leads
GET /api/leads/:id/status
PATCH /api/leads/:id/status
```

Estos endpoints estan deprecated y no forman parte del runtime LeadFlow actual. El frontend LeadFlow no debe llamarlos. Quedan pendientes de limpieza fisica posterior junto con Prisma/local DB.

## Variables de entorno server-side

No commitear valores reales, hashes ni secretos. Documentar siempre con placeholders.

```env
FLUENTCRM_CONTACT_WEBHOOK_URL="https://crm.kurukin.com/?fluentcrm=1&route=contact&hash=..."
FLUENTCRM_WEBHOOK_PAYLOAD_MODE="hybrid"
N8N_LEADFLOW_EVALUATE_WEBHOOK_URL="http://n8n_v2_webhook:5678/webhook/leadflow-eval"
PORT="3001"
NODE_ENV="production"
```

## Variables frontend

```env
VITE_LEADFLOW_WHATSAPP_NUMBER="591..."
VITE_WHATSAPP_NUMBER="591..."
VITE_SITE_ID="kurukinleadflow"
```

El fallback de codigo para `VITE_SITE_ID` es `kurukinleadflow`. Alinear `.env`, n8n y cualquier relay con esa llave cuando corresponda.

## FluentCRM

Lista oficial:

```text
LeadFlow Leads
```

Tags oficiales:

```text
leadflow
leadflow-meta
leadflow-oro
leadflow-plata
leadflow-descarte
leadflow-ai-evaluated
```

Custom fields oficiales:

```text
leadflow_codigo_evaluacio
leadflow_clasificacion
leadflow_compania
leadflow_tamano_equipo
leadflow_freno_duplicacio
leadflow_origen_leads
leadflow_financiacion
leadflow_toma_decision
leadflow_event_id
leadflow_fbp
leadflow_fbc
leadflow_ttclid
leadflow_ttp
leadflow_ai_diagnostico
leadflow_dolor_psicologic
leadflow_estrategia_cierr
leadflow_estado_venta
leadflow_fecha_evaluacion
leadflow_evaluado_por
leadflow_descarte_motivo
```

Algunos slugs estan truncados intencionalmente por FluentCRM y no deben corregirse ni completarse en codigo o documentacion: `leadflow_codigo_evaluacio`, `leadflow_freno_duplicacio`, `leadflow_dolor_psicologic`, `leadflow_estrategia_cierr`.

Pais, ciudad, estado, ZIP, telefono, email y nombre van como campos nativos de FluentCRM. Los custom fields guardan solo datos especificos de LeadFlow.

## Codigos de evaluacion

```text
ORO = KLF-A-XXXXXXXX
PLATA = KLF-B-XXXXXXXX
DESCARTE = KLF-C-XXXXXXXX
```

Reglas runtime:

- El backend valida codigos con `/^KLF-[ABC]-[A-Z0-9]{6,12}$/`.
- El backend regenera el codigo si n8n manda uno invalido.
- No se permiten sufijos `MANUAL`, `DEV`, `TEST`, `LEADFLOW` ni `MOCK`.

## Tracking

- Browser tracking dispara conversion solo para `ORO` y `PLATA`, y solo cuando la visita actual esta clasificada como paid confirmado para la plataforma correspondiente.
- Meta CAPI corre en n8n para `ORO` y `PLATA`.
- `DESCARTE` y guillotina local no deben generar conversion.
- `eventId` del payload LeadFlow representa el evento logico `Lead_Calificado`; `sessionId` queda separado.

El navegador captura atribucion actual, UTMs, `fbp`, `fbc`, `ttclid`, `ttp`, `eventId` y `sessionId`; el backend los preserva para FluentCRM/n8n. n8n conserva la responsabilidad de enviar Meta CAPI y de evitar conversiones para descartes. El relay CAPI desde navegador queda apagado por defecto salvo `VITE_ENABLE_BROWSER_RELAY=true`.

## DNS / Origin

```text
kurukin.com debe apuntar solo al servidor Docker/Traefik.
crm.kurukin.com apunta al servidor WordPress/LiteSpeed.
No debe existir A record de kurukin.com hacia el servidor CRM.
```

`kurukin.com` ya no debe resolver al origin LiteSpeed del CRM. Ese servidor queda reservado para `crm.kurukin.com` y FluentCRM.

## Publicacion y verificacion

Build local:

```bash
npm run typecheck
npx tsc --noEmit -p tsconfig.node.json
npm run build
```

Comandos correctos de publicacion cuando se requiera redeploy:

```bash
rsync -a --delete dist/ /opt/webs/kurukin.com/public_html/
docker service update --force kurukin-web_kurukin_web
docker service update --force kurukin-web_kurukin_api
```

Checklist rapido post-deploy:

```bash
grep -R "/api/leads" -n /opt/webs/kurukin.com/public_html | head
grep -R "/api/leadflow/evaluate" -n /opt/webs/kurukin.com/public_html | head
grep -R "/api/leadflow/capture-local-discard" -n /opt/webs/kurukin.com/public_html | head

curl -sL "https://kurukin.com/leadflow?cb=$(date +%s)" | grep -o 'assets/index-[^"]*\.js'

docker service logs kurukin-web_kurukin_api --since 5m | grep -Ei "leadflow|fluent|n8n|upsert|final|suspicious"
```
