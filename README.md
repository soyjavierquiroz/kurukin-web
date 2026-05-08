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

## Integración CAPI por Handover

La web usa un modelo de handover para el tracking CAPI de Leadflow. El cliente no llama directamente al relay interno de Docker Swarm; solo captura el contexto de analítica, envía la aplicación al webhook de evaluación de n8n y dispara los píxeles de navegador cuando n8n confirma `es_valido: true`.

Flujo actual:

- `src/lib/analytics.ts` genera un `eventId` UUID persistido por sesión y captura `fbp`, `fbc` y `ttclid`.
- `src/components/LeadflowApplicationForm.tsx` incluye `analytics` dentro del payload enviado a `https://webhooks.kuruk.in/webhook/leadflow-eval`.
- n8n valida el lead y, si corresponde, usa ese contexto para hablar con `kurukin-relay` dentro de la red interna.
- El navegador solo completa la deduplicación disparando Meta `fbq` y TikTok `ttq` con el mismo `eventId`.

## Infraestructura de Tracking

Variable de sitio:

```env
VITE_SITE_ID="kurukinleadflow"
```

`VITE_SITE_ID` identifica el flujo de tracking que n8n debe entregar al relay interno. Si la variable no está definida, la web usa `kurukinleadflow` como valor por defecto.

El objeto `analytics` enviado a n8n tiene esta forma:

```ts
{
  eventId: string;
  siteId: string;
  fbp: string | null;
  fbc: string | null;
  ttclid: string | null;
}
```

El `eventId` es la llave de deduplicación entre el evento de navegador y el evento server-side que n8n envía al relay. El relay conserva la responsabilidad de normalizar, limpiar y hashear datos sensibles antes de enviarlos a las APIs de conversión.
