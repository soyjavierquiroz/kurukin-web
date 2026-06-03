# Tracking and Attribution

Este documento describe el tracking actual de Kurukin / LeadFlow despues del endurecimiento de atribucion paid media.

## Estado Actual

La capa activa vive en:

- `src/lib/attribution.ts`: captura y clasifica la visita actual.
- `src/lib/analytics.ts`: inicializa pixels, genera event IDs y envia eventos browser.
- `src/components/LeadflowApplicationForm.tsx`: envia el contexto de analitica dentro del payload de LeadFlow.

La URL canonica para campanas sigue siendo:

```text
https://kurukin.com/leadflow/
```

No existe ni se requiere `/leadflow/a`.

## Runtime LeadFlow

```text
React LeadFlow
-> POST /api/leadflow/evaluate
-> kurukin_api
-> FluentCRM initial upsert
-> n8n scoring sincrono
-> FluentCRM final upsert
-> React resultado
-> WhatsApp
-> Meta CAPI oficial desde n8n para ORO/PLATA segun politica
```

Para guillotina local, React llama:

```text
POST /api/leadflow/capture-local-discard
```

Ese camino registra el descarte local y no debe generar conversion publicitaria.

## Clasificacion De Visita Actual

La clasificacion actual no depende de cookies viejas. `_fbc`, `_fbp`, `_ttp` y cookies `ttclid` historicas son match keys tecnicas, no prueba suficiente de paid.

Tipos posibles:

- `meta_paid`
- `tiktok_paid`
- `paid_unknown`
- `organic_social`
- `whatsapp`
- `referral`
- `direct`
- `unknown`

El resultado tambien incluye:

```ts
{
  paidConfirmed: boolean;
  paidPlatform: 'meta' | 'tiktok' | 'unknown' | null;
  paidSignal: 'fbclid' | 'ttclid' | 'utm_paid' | null;
  paidIntent: boolean;
}
```

Reglas principales:

- Meta paid: `fbclid` actual en URL, o `utm_source` en `meta/facebook/instagram` con `utm_medium` en `paid/paid_social/cpc/ads`.
- TikTok paid: `ttclid` actual en URL, o `utm_source=tiktok` con `utm_medium` en `paid/paid_social/cpc/ads`.
- Paid unknown: medium paid sin source clara.
- WhatsApp: `utm_source=whatsapp` o `utm_medium=message`.
- Organic social: `utm_medium=organic` o referrer social sin click ID paid actual.
- Direct: sin referrer, sin UTMs y sin click ID actual.
- Referral: referrer externo sin paid actual.

## Persistencia First-Party

Se guardan tres touches con TTL de 7 dias:

```text
kurukin_attribution_current_touch
kurukin_attribution_first_touch
kurukin_attribution_last_touch
```

Cada touch incluye:

- `trafficType`, `paidConfirmed`, `paidPlatform`, `paidSignal`, `paidIntent`.
- `fbclid`, `fbc`, `fbp`, `ttclid`, `ttp`.
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
- `referrer`, `landingUrl`, `pagePath`, `currentUrl`, `timestamp`.

`first_touch` no se sobrescribe mientras siga vigente. `last_touch` se actualiza cuando entra un nuevo click ID, una UTM paid, una UTM atribuible o un referrer atribuible.

## Inicializacion De Pixels

Meta Pixel solo se inicializa si la visita actual queda:

```text
paidPlatform=meta
paidConfirmed=true
```

No se inicializa solo por `_fbp`. No se inicializa solo por `_fbc` vieja.

Si llega `fbclid` actual y no hay `_fbc`, se construye:

```text
fb.1.<timestamp_ms>.<fbclid>
```

TikTok Pixel solo se inicializa si la visita actual queda:

```text
paidPlatform=tiktok
paidConfirmed=true
```

No se inicializa solo por `_ttp`. No se inicializa solo por cookie `ttclid` vieja.

## Eventos Browser

### PageView

`/leadflow/` llama `trackPageView()` al montar la pagina.

- Meta: envia `fbq('track', 'PageView', ..., { eventID })` solo en `meta_paid`.
- TikTok: envia `ttq.page()` solo en `tiktok_paid`.
- TikTok tiene guard por ruta para evitar doble `PageView`.

`initTikTokPixel()` ya no llama `ttq.page()`. La unica fuente de `PageView` TikTok es `trackPageView()`.

### Lead_Calificado

Se dispara solo si el backend/n8n devuelve `ORO` o `PLATA`.

- Meta browser: `fbq('trackCustom', 'Lead_Calificado', custom_data, { eventID })` solo en `meta_paid`.
- TikTok browser: `ttq.track('CompleteRegistration', custom_data, { event_id })` solo en `tiktok_paid`.
- `DESCARTE` y guillotina local no disparan conversion browser.

## Event IDs

Se mantiene `sessionId` separado para sesion.

Cada evento logico genera su propio event ID:

```ts
createAnalyticsEventId(eventName: string): string
```

Para LeadFlow:

- `PageView` usa un event ID propio.
- `Lead_Calificado` usa un event ID propio.
- `analytics.eventId` en el payload del formulario representa el evento de conversion `Lead_Calificado`.
- Ese mismo `eventId` se reutiliza en browser pixel y queda disponible para n8n/CAPI.

## Browser Relay / CAPI

Meta CAPI oficial de LeadFlow vive en n8n.

El relay browser queda desactivado por defecto. Solo se activa explicitamente con:

```env
VITE_ENABLE_BROWSER_RELAY="true"
```

Si el flag no esta en `true`, `trackEvent()` no llama `VITE_CAPI_RELAY_URL`.

Recomendacion para n8n:

- Meta CAPI deberia dispararse solo para `ORO` o `PLATA`.
- Preferiblemente solo cuando `paidPlatform=meta && paidConfirmed=true`, salvo decision comercial contraria.
- TikTok Events API queda pendiente si no existe.

## Payload De Analitica Hacia Backend

El frontend envia dentro de `analytics` en:

- `/api/leadflow/evaluate`
- `/api/leadflow/capture-local-discard`

Forma esperada:

```ts
{
  eventId: string;
  sessionId: string;
  siteId: string;
  trafficType: string;
  paidConfirmed: boolean;
  paidPlatform: 'meta' | 'tiktok' | 'unknown' | null;
  paidSignal: 'fbclid' | 'ttclid' | 'utm_paid' | null;
  paidIntent: boolean;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  ttclid: string | null;
  ttp: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landingUrl: string;
  pagePath: string;
  clientIp: string | null;
  client_ip: string | null;
  userAgent: string | null;
  hasMetaSignal: boolean;
  hasTikTokSignal: boolean;
}
```

Se mantienen `fbc`, `fbp`, `ttclid` y `ttc` en el payload de primer nivel por compatibilidad.

## Site ID

El fallback/hardcode operativo es:

```text
kurukinleadflow
```

Si `.env` define `VITE_SITE_ID`, Vite usa ese valor compilado. La recomendacion es alinear `.env`, n8n y cualquier relay con `kurukinleadflow`.

## URLs Correctas Para Campanas

### Meta Ads

```text
https://kurukin.com/leadflow/?utm_source=meta&utm_medium=paid_social&utm_campaign=NOMBRE_CAMPANA&utm_content=NOMBRE_ANUNCIO
```

### Instagram Ads

```text
https://kurukin.com/leadflow/?utm_source=instagram&utm_medium=paid_social&utm_campaign=NOMBRE_CAMPANA&utm_content=NOMBRE_ANUNCIO
```

### Facebook Ads

```text
https://kurukin.com/leadflow/?utm_source=facebook&utm_medium=paid_social&utm_campaign=NOMBRE_CAMPANA&utm_content=NOMBRE_ANUNCIO
```

### TikTok Ads

```text
https://kurukin.com/leadflow/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=NOMBRE_CAMPANA&utm_content=NOMBRE_ANUNCIO
```

### WhatsApp Organico

```text
https://kurukin.com/leadflow/?utm_source=whatsapp&utm_medium=message&utm_campaign=organico
```

### Organico Social

```text
https://kurukin.com/leadflow/?utm_source=instagram&utm_medium=organic&utm_campaign=perfil
```

## Tests Manuales Esperados

### A. Directo

```text
/leadflow
```

Esperado:

- No Meta Pixel.
- No TikTok Pixel.
- No PageView paid.
- Si termina `ORO`, no browser pixel paid.

### B. Meta Click ID

```text
/leadflow?fbclid=TEST123&utm_source=meta&utm_medium=paid_social
```

Esperado:

- `trafficType=meta_paid`.
- Meta Pixel activo.
- `_fbc` construido/persistido si no existia.
- `PageView` Meta browser.
- `ORO/PLATA` dispara `Lead_Calificado` Meta browser y deja el mismo `eventId` para n8n CAPI.
- `DESCARTE` no dispara `Lead_Calificado`.

### C. TikTok Click ID

```text
/leadflow?ttclid=TEST456&utm_source=tiktok&utm_medium=paid_social
```

Esperado:

- `trafficType=tiktok_paid`.
- TikTok Pixel activo.
- `PageView` TikTok una sola vez por ruta.
- `ORO/PLATA` dispara `CompleteRegistration` TikTok browser.
- `DESCARTE` no dispara conversion.

### D. UTM Meta Sin fbclid

```text
/leadflow?utm_source=meta&utm_medium=paid_social
```

Esperado:

- `trafficType=meta_paid`.
- Meta Pixel activo por UTM paid actual.
- No se crea `_fbc` si no hay `fbclid`.
- `_fbp` se usa si el pixel lo genera.

### E. Cookie Vieja Sin URL Paid

Visita directa a:

```text
/leadflow
```

con `_fbp`, `_fbc`, `_ttp` o cookie `ttclid` previa.

Esperado:

- No clasificar paid por cookie sola.
- No activar Meta Pixel por cookie sola.
- No activar TikTok Pixel por cookie sola.

## Que No Se Debe Hacer

- No mandar campanas pagadas sin UTMs.
- No usar solo `utm_medium=paid` sin `utm_source` para plataformas concretas.
- No mezclar URLs organicas con URLs de anuncios.
- No reutilizar la URL limpia `/leadflow/` para campanas pagadas.
- No asumir que toda visita con cookie vieja es paid.
- No usar un solo `event_id` para todos los eventos de una sesion.
- No disparar dos PageView de TikTok para la misma vista.
- No enviar eventos de organico como si fueran de Meta Ads o TikTok Ads.

## Cambios Pendientes

- Validar en n8n la politica final de Meta CAPI: `ORO/PLATA` y, preferiblemente, `paidPlatform=meta && paidConfirmed=true`.
- Implementar TikTok Events API si se decide medir server-side en TikTok.
- Agregar tracking propio para `FormStart`, `SubmitForm`, `WhatsAppClick`, `DownsellView` e `InitiateCheckout`.
- Alinear `.env` productivo con `VITE_SITE_ID=kurukinleadflow` cuando corresponda.
