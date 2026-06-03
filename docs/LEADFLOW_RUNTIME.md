# LeadFlow Runtime

Este documento deja el registro tecnico del runtime vivo de LeadFlow. No describe el flujo legacy con Prisma/local DB.

## Flujo Completo

```text
React LeadFlow
-> POST /api/leadflow/evaluate en kurukin_api
-> FluentCRM initial upsert
-> n8n scoring sincrono
-> FluentCRM final upsert
-> React resultado
-> WhatsApp
-> Meta CAPI solo para ORO/PLATA desde n8n
```

Para descartes por guillotina local:

```text
React LeadFlow
-> POST /api/leadflow/capture-local-discard en kurukin_api
-> FluentCRM upsert como descarte local
-> React resultado DESCARTE
-> WhatsApp
```

Ese camino no llama n8n y no debe disparar conversion.

## Servicios

```text
kurukin-web_kurukin_web = Nginx estatico React + proxy /api
kurukin-web_kurukin_api = Node/tsx backend API
n8n_n8n_v2_webhook = webhook interno n8n
crm.kurukin.com = WordPress + FluentCRM externo
```

## Redes

```text
kurukin_api y n8n comparten general_network
kurukin_web usa traefik_public + general_network
URL interna n8n: http://n8n_v2_webhook:5678/webhook/leadflow-eval
```

`kurukin.com` debe apuntar solo al servidor Docker/Traefik. `crm.kurukin.com` apunta al servidor WordPress/LiteSpeed. No debe existir A record de `kurukin.com` hacia el servidor CRM.

## Endpoints

Endpoints vivos:

```text
POST /api/leadflow/evaluate
POST /api/leadflow/capture-local-discard
```

Endpoints legacy deprecated:

```text
POST /api/leads
GET /api/leads/:id/status
PATCH /api/leads/:id/status
```

El frontend LeadFlow no debe llamar endpoints legacy. Quedan pendientes de limpieza fisica posterior junto con Prisma/local DB.

## Variables Server-Side

No guardar valores reales, hashes ni secretos en documentacion o git.

```env
FLUENTCRM_CONTACT_WEBHOOK_URL="https://crm.kurukin.com/?fluentcrm=1&route=contact&hash=..."
FLUENTCRM_WEBHOOK_PAYLOAD_MODE="hybrid"
N8N_LEADFLOW_EVALUATE_WEBHOOK_URL="http://n8n_v2_webhook:5678/webhook/leadflow-eval"
PORT="3001"
NODE_ENV="production"
```

## Variables Frontend

```env
VITE_LEADFLOW_WHATSAPP_NUMBER="591..."
VITE_WHATSAPP_NUMBER="591..."
VITE_SITE_ID="kurukinleadflow"
```

El fallback de codigo para `VITE_SITE_ID` es `kurukinleadflow`. Alinear `.env`, n8n y cualquier relay con esa llave cuando corresponda.

## FluentCRM

Lista:

```text
LeadFlow Leads
```

Tags:

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

Los slugs truncados por FluentCRM son intencionales y no deben corregirse: `leadflow_codigo_evaluacio`, `leadflow_freno_duplicacio`, `leadflow_dolor_psicologic`, `leadflow_estrategia_cierr`.

## Codigos De Evaluacion

```text
ORO = KLF-A-XXXXXXXX
PLATA = KLF-B-XXXXXXXX
DESCARTE = KLF-C-XXXXXXXX
```

El backend valida codigos con `/^KLF-[ABC]-[A-Z0-9]{6,12}$/`, regenera si n8n manda un codigo invalido y rechaza sufijos `MANUAL`, `DEV`, `TEST`, `LEADFLOW` o `MOCK`.

## Tracking

- Browser tracking dispara conversion solo para `ORO` y `PLATA`.
- Meta CAPI corre en n8n.
- `DESCARTE` y guillotina local no deben generar conversion.
- `eventId` es la llave de deduplicacion.

## Como Probar

Validaciones locales:

```bash
npm run typecheck
npx tsc --noEmit -p tsconfig.node.json
npm run build
```

Verificar build publicado sin redeploy:

```bash
curl -sL "https://kurukin.com/leadflow?cb=$(date +%s)" | grep -o 'assets/index-[^"]*\.js'
```

Verificar que el frontend publicado usa endpoints vivos:

```bash
grep -R "/api/leads" -n /opt/webs/kurukin.com/public_html | head
grep -R "/api/leadflow/evaluate" -n /opt/webs/kurukin.com/public_html | head
grep -R "/api/leadflow/capture-local-discard" -n /opt/webs/kurukin.com/public_html | head
```

## Como Leer Logs

API LeadFlow:

```bash
docker service logs kurukin-web_kurukin_api --since 5m | grep -Ei "leadflow|fluent|n8n|upsert|final|suspicious"
```

Web/Nginx:

```bash
docker service logs kurukin-web_kurukin_web --since 5m
```

n8n webhook:

```bash
docker service logs n8n_n8n_v2_webhook --since 5m | grep -Ei "leadflow|capi|meta|fluent|error"
```

## Errores Comunes

- `FLUENTCRM_CONTACT_WEBHOOK_URL is not configured`: falta configurar el webhook server-side en `kurukin_api`.
- Timeout o error hacia n8n: revisar que `kurukin_api` y `n8n_n8n_v2_webhook` compartan `general_network`.
- Resultado sin codigo valido: el backend debe regenerar un `KLF-A/B/C-XXXXXXXX`.
- Frontend llamando `/api/leads`: build viejo o cacheado; redeployar `dist/` y forzar servicio web.
- Contacto sin tags/lista: revisar payload mode `hybrid`, slugs truncados y configuracion de FluentCRM.
- Conversion en descarte: revisar n8n; `DESCARTE` y guillotina local no deben enviar Meta CAPI.
- `kurukin.com` resolviendo al servidor CRM: corregir DNS/origin; solo `crm.kurukin.com` debe apuntar a WordPress/LiteSpeed.

## Checklist Post-Deploy

```bash
grep -R "/api/leads" -n /opt/webs/kurukin.com/public_html | head
grep -R "/api/leadflow/evaluate" -n /opt/webs/kurukin.com/public_html | head
grep -R "/api/leadflow/capture-local-discard" -n /opt/webs/kurukin.com/public_html | head

curl -sL "https://kurukin.com/leadflow?cb=$(date +%s)" | grep -o 'assets/index-[^"]*\.js'

docker service logs kurukin-web_kurukin_api --since 5m | grep -Ei "leadflow|fluent|n8n|upsert|final|suspicious"
```

Comandos correctos de redeploy cuando aplique:

```bash
rsync -a --delete dist/ /opt/webs/kurukin.com/public_html/
docker service update --force kurukin-web_kurukin_web
docker service update --force kurukin-web_kurukin_api
```
