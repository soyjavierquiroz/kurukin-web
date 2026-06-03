# Tracking and Attribution

Este documento describe como funciona hoy el tracking de Kurukin / LeadFlow y cual es la estrategia recomendada para separar trafico pagado, organico, directo, referido y WhatsApp sin contaminar la data publicitaria.

## Estado Actual

La implementacion actual vive principalmente en `src/lib/analytics.ts`.

El arranque ocurre en `src/main.tsx`, donde se llama `initPixels()` antes de renderizar la app. Esa funcion revisa senales de trafico pagado y decide si carga o no los pixeles de navegador.

Hoy el sistema esta construido con una regla conservadora: si no existe una senal de Meta o TikTok, no se inicializan los pixeles y los eventos publicitarios de navegador quedan bloqueados.

Senales actuales usadas:

- `fbclid` en la URL actual.
- `_fbc` en cookies, desde donde se puede extraer un `fbclid` historico.
- `ttclid` en la URL actual.
- `ttclid` o `_ttclid` en cookies.
- `_fbp` y `_ttp` se capturan como cookies tecnicas de matching.

Variables de entorno usadas:

```env
VITE_META_PIXEL_ID="..."
VITE_TIKTOK_PIXEL_ID="..."
VITE_SITE_ID="kurukinleadflow"
```

Deuda pendiente: el codigo actual todavia conserva `KURUKIN` como fallback/constante de `siteId` en algunas rutas. La llave operativa a estandarizar es `kurukinleadflow`.

## Runtime LeadFlow Actual

El frontend publicado de LeadFlow ya no llama `/api/leads` ni llama directamente al relay CAPI. El flujo vivo es:

```text
React LeadFlow
-> POST /api/leadflow/evaluate
-> kurukin_api
-> FluentCRM initial upsert
-> n8n scoring sincrono
-> FluentCRM final upsert
-> React resultado
-> WhatsApp
-> Meta CAPI solo para ORO/PLATA desde n8n
```

Para guillotina local, React llama `POST /api/leadflow/capture-local-discard`; ese camino registra el descarte en FluentCRM, no llama n8n y no debe generar conversion.

## Inicializacion De Pixeles

Meta Pixel se inicializa en `src/lib/analytics.ts`:

- `initPixels()` lee las senales actuales.
- Si detecta `fbclid` o puede extraerlo desde `_fbc`, llama `initMetaPixel()`.
- `initMetaPixel()` crea el stub `window.fbq`, carga `https://connect.facebook.net/en_US/fbevents.js` y ejecuta `fbq('init', VITE_META_PIXEL_ID)`.
- Usa `window.__kurukinMetaPixelInitialized` para evitar inicializar Meta mas de una vez.

TikTok Pixel se inicializa en `src/lib/analytics.ts`:

- `initPixels()` lee las senales actuales.
- Si detecta `ttclid` en URL o cookie, llama `initTikTokPixel()`.
- `initTikTokPixel()` crea el stub `window.ttq`, carga `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=...&lib=ttq`, ejecuta `ttq.load(VITE_TIKTOK_PIXEL_ID)` y luego `ttq.page()`.
- Usa `window.__kurukinTikTokPixelInitialized` para evitar inicializar TikTok mas de una vez.

## Por Que Los Pixeles Se Activan Solo Con Senales

La intencion actual es proteger los algoritmos publicitarios y evitar que trafico organico, directo, referido o WhatsApp se mande como trafico de campanas pagadas.

Si no hay `fbclid` ni `ttclid`, `trackEvent()` bloquea el envio de eventos:

- No envia Meta Pixel.
- No envia TikTok Pixel.
- No envia CAPI Relay.

Esto reduce contaminacion, pero tambien tiene riesgos documentados mas abajo.

## Eventos Actuales

### PageView

Se dispara en `/leadflow/` cuando se monta `LeadflowPage`.

Flujo actual:

- Browser Meta: si hay senal Meta, envia `fbq('track', 'PageView', ..., { eventID })`.
- Browser TikTok: si hay senal TikTok, envia `ttq.page()`.
- CAPI Relay: si hay senal Meta o TikTok, envia `PageView` a `VITE_CAPI_RELAY_URL`.

Nota importante: `initTikTokPixel()` ya ejecuta `ttq.page()` al cargar el pixel. Despues, `trackPageView()` puede ejecutar otro `ttq.page()` para la misma vista. Esto crea riesgo de doble PageView en TikTok.

### Lead_Calificado

Se dispara cuando el formulario de LeadFlow termina, `kurukin_api` recibe una evaluacion normalizada desde n8n y el resultado aprobado es `ORO` o `PLATA`.

Flujo actual:

- Browser Meta: `fbq('trackCustom', 'Lead_Calificado', custom_data, { eventID })`.
- Browser TikTok: `ttq.track('CompleteRegistration', custom_data, { event_id })`.
- Meta CAPI: n8n envia el evento server-side usando el mismo `eventId`.

El payload incluye datos de usuario para matching:

- `em`: email normalizado.
- `ph`: telefono / WhatsApp.
- `fn`: nombre completo.

Tambien incluye `custom_data`:

- `content_name: 'qualified_lead'`.
- `value: 10`.
- `currency: 'USD'`.
- `clasificacion`: estatus de evaluacion, por ejemplo `ORO` o `PLATA`.

### SubmitForm

Existe como helper `trackSubmitForm()`, pero actualmente no se encontro uso en el flujo de `/leadflow/`.

Si se llamara, enviaria `SubmitForm` mediante `trackEvent()`.

### Lead

Existe como fallback `trackLead()`, pero actualmente no se encontro uso en el flujo de `/leadflow/`.

Si se llamara, enviaria `Lead` mediante `trackEvent()`.

### CTA, WhatsApp, Downsell Y Checkout

Actualmente no tienen tracking publicitario propio:

- Clicks en CTAs que abren el formulario: no disparan evento.
- Avance de pasos del formulario: no dispara evento publicitario.
- Click final hacia WhatsApp: no dispara evento propio.
- Redireccion a downsell: no dispara evento propio.
- Vista de `/getleadflow` o `/downsell`: no dispara `PageView` explicito desde esa pagina.
- Click al checkout Hotmart: no dispara `InitiateCheckout`.

## Eventos Que Van Al Navegador

Meta Pixel:

- `PageView`, cuando existe senal Meta.
- `Lead_Calificado`, como custom event, cuando existe senal Meta y el lead es `ORO` o `PLATA`.
- `SubmitForm` y `Lead` estan definidos como helpers, pero no se usan hoy en LeadFlow.

TikTok Pixel:

- `PageView`, mediante `ttq.page()`, cuando existe senal TikTok.
- `CompleteRegistration`, equivalente actual de `Lead_Calificado`, cuando existe senal TikTok y el lead es `ORO` o `PLATA`.

## Eventos Server-Side

El frontend no llama directamente al relay CAPI. El navegador envia el contexto de analitica dentro del payload de LeadFlow a:

```text
POST /api/leadflow/evaluate
```

n8n recibe ese contexto desde `kurukin_api` y ejecuta Meta CAPI solo para `ORO` y `PLATA`.

Eventos posibles:

- `Lead_Calificado`, usado para leads aprobados `ORO` o `PLATA`.
- `DESCARTE` y guillotina local no deben enviar conversion server-side.

## Payload Actual De Analitica

El payload de analitica que viaja dentro de LeadFlow tiene esta forma conceptual:

```ts
{
  eventId: string;
  siteId: string;
  fbp: string | null;
  fbc: string | null;
  ttclid: string | null;
  ttp: string | null;
}
```

Campos que hoy no se envian de forma estructurada:

- `utm_source`.
- `utm_medium`.
- `utm_campaign`.
- `utm_content`.
- `utm_term`.
- `referrer`.
- `landing_url`.
- `page_path`.
- `source`.
- `medium`.
- `campaign`.
- `traffic_type`.
- `first_touch`.
- `last_touch`.

## Deduplicacion Actual

El sistema genera un `event_id` con `crypto.randomUUID()` y lo guarda en `sessionStorage` bajo:

```text
kurukin_analytics_event_id
```

Ese mismo ID se usa para:

- Evento de navegador Meta, mediante `eventID`.
- Evento de navegador TikTok en `Lead_Calificado`, mediante `event_id`.
- Evento Meta CAPI enviado por n8n, mediante `event_id`.
- Payload de LeadFlow, mediante `eventId`.

La intencion es que Meta y TikTok puedan deduplicar el evento de navegador contra el evento server-side cuando ambos representan la misma accion.

## Riesgo Del Event ID Unico Por Sesion

Hoy el `event_id` es unico por sesion, no por evento.

Eso puede provocar problemas:

- `PageView` y `Lead_Calificado` pueden compartir el mismo `event_id`.
- Si el usuario repite acciones dentro de la misma sesion, eventos distintos pueden compartir el mismo ID.
- Las plataformas podrian deduplicar de mas o perder granularidad.

Recomendacion futura: generar un `event_id` por evento logico y reutilizarlo solo entre browser pixel y CAPI para ese mismo evento.

Ejemplo:

- `PageView`: `event_id=A`.
- `FormStart`: `event_id=B`.
- `Lead_Calificado`: `event_id=C`.
- `InitiateCheckout`: `event_id=D`.

## Riesgos Actuales

### TikTok PageView Duplicado

TikTok puede recibir dos PageView para una sola vista:

- Uno durante `initTikTokPixel()`, por `ttq.page()`.
- Otro durante `trackPageView()`, tambien por `ttq.page()`.

Ademas, el `ttq.page()` del navegador no recibe `event_id`, mientras que el relay si recibe `event_id`.

### Falta De UTMs Y Referrer

Hoy no se captura ni se envia:

- UTMs actuales.
- Referrer actual.
- Landing URL separada.
- First touch.
- Last touch.
- Clasificacion de canal.

Esto hace dificil diferenciar correctamente entre Meta Ads, TikTok Ads, organico, directo, referido y WhatsApp.

### Cookie Vieja Puede Parecer Paid

Una cookie antigua como `_fbc`, `_fbp`, `_ttp` o `ttclid` puede existir porque el usuario llego en el pasado desde un anuncio.

Riesgo: una visita organica posterior podria parecer paid si la clasificacion depende solo de cookies historicas.

Regla conceptual:

No debemos clasificar trafico como Meta paid o TikTok paid solo porque existe una cookie vieja.

Las cookies como `_fbc`, `_fbp`, `_ttp` o `ttclid` pueden ayudar a matching/deduplicacion, pero la clasificacion de la visita actual debe basarse principalmente en senales de entrada actuales:

- URL actual.
- UTMs actuales.
- Click id actual.
- Referrer actual.
- Landing URL.
- Fecha/hora del touch.

### Paid Con UTMs Pero Sin Click ID Puede Perderse

Si una campana pagada llega con UTMs correctas pero sin `fbclid` o `ttclid`, hoy puede quedar clasificada como sin senal pagada y los eventos se bloquean.

Ejemplo problematico:

```text
https://kurukin.com/leadflow/?utm_source=meta&utm_medium=paid_social&utm_campaign=campana
```

Si Meta no agrega `fbclid`, la logica actual no activa Meta Pixel ni CAPI, aunque conceptualmente sea paid.

## Tipos De Atribucion

### Visita Actual

Es la clasificacion de la entrada actual del usuario.

Debe basarse en:

- URL actual.
- Parametros actuales.
- Click id actual.
- Referrer actual.
- Momento de la visita.

Esta es la clasificacion mas importante para decidir si una visita actual es Meta paid, TikTok paid, organica, directa, referida o WhatsApp.

### First Touch

Es la primera fuente conocida por la que el usuario llego.

Sirve para entender origen historico del usuario, pero no debe reemplazar la clasificacion de la visita actual.

### Last Touch

Es la fuente mas reciente antes de la conversion.

Sirve para atribucion comercial y reporting, pero debe conservar sus propios timestamps y no mezclar paid con organico por cookies viejas.

### Cookies Tecnicas Para Matching Y Deduplicacion

Cookies como `_fbc`, `_fbp`, `_ttp` y `ttclid` ayudan a las plataformas a hacer matching o deduplicacion.

No deben usarse por si solas como prueba suficiente de que la visita actual es pagada.

## Regla Recomendada De Clasificacion

### Meta Paid

Clasificar como `meta_paid` si:

- `fbclid` esta presente en la URL actual.
- O `utm_source` es `meta`, `facebook` o `instagram` junto con `utm_medium` igual a `paid`, `cpc` o `paid_social`.

### TikTok Paid

Clasificar como `tiktok_paid` si:

- `ttclid` esta presente en la URL actual.
- O `utm_source=tiktok` junto con `utm_medium` igual a `paid`, `cpc` o `paid_social`.

### Paid Unknown

Clasificar como `paid_unknown` si:

- `utm_medium` es `paid`, `cpc` o `paid_social`.
- Y no hay fuente clara para Meta, TikTok u otra plataforma.

### Organic Social

Clasificar como `organic_social` si:

- El referrer pertenece a una red social.
- O `utm_medium=organic`.
- Y no hay click id publicitario actual.

### WhatsApp

Clasificar como `whatsapp` si:

- `utm_source=whatsapp`.
- O `utm_medium=message`, `social` o `referral` cuando el contexto indique que viene de WhatsApp.

### Direct

Clasificar como `direct` si:

- No hay referrer.
- No hay UTMs.
- No hay click id actual.

### Referral

Clasificar como `referral` si:

- Hay referrer externo.
- No hay click id publicitario actual.
- No hay UTMs paid.

### Unknown

Clasificar como `unknown` si:

- Las senales son insuficientes.
- O las senales son conflictivas.

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

## Que No Se Debe Hacer

- No mandar campanas pagadas sin UTMs.
- No usar solo `utm_medium=paid` sin `utm_source`.
- No mezclar URLs organicas con URLs de anuncios.
- No reutilizar la misma URL limpia `/leadflow/` para campanas pagadas.
- No asumir que toda visita con cookie vieja es paid.
- No usar un solo `event_id` para todos los eventos de una sesion.
- No disparar dos PageView de TikTok para la misma vista.
- No enviar eventos de organico como si fueran de Meta Ads o TikTok Ads.

## Checklist Antes De Lanzar Campanas

- La URL del anuncio tiene `utm_source`.
- La URL del anuncio tiene `utm_medium`.
- La URL del anuncio tiene `utm_campaign`.
- Meta usa source `meta`, `facebook` o `instagram`.
- TikTok usa source `tiktok`.
- Paid usa medium `paid_social` o `cpc`.
- WhatsApp no usa medium paid.
- Organico no usa medium paid.
- La URL final abre `/leadflow/`.
- El formulario funciona.
- El evento `Lead_Calificado` se dispara solo para `ORO` o `PLATA`.
- n8n envia Meta CAPI solo para `ORO` o `PLATA`.
- No hay doble PageView.
- El checkout/Hotmart se prueba aparte.

## Cambios Tecnicos Recomendados

Estos cambios estan documentados para una fase posterior. No forman parte de la implementacion actual.

- Crear un modulo de atribucion que capture UTMs, click ids actuales, referrer, landing URL, timestamps y page path.
- Separar `current_touch`, `first_touch` y `last_touch`.
- Guardar atribucion en almacenamiento propio con timestamps claros.
- Mantener cookies tecnicas para matching, pero no usarlas solas como clasificacion paid.
- Enviar `traffic_type`, `source`, `medium`, `campaign`, `content`, `term`, `referrer`, `landing_url` y `page_path` a n8n/relay.
- Generar `event_id` por evento y compartirlo solo entre browser pixel y CAPI del mismo evento.
- Corregir el doble PageView de TikTok.
- Agregar tracking propio para `FormStart`, `SubmitForm`, `WhatsAppClick`, `DownsellView` e `InitiateCheckout`.
- Asegurar que `/leadflow/`, `/getleadflow/`, `/downsell` y checkout compartan una capa unica de tracking.
