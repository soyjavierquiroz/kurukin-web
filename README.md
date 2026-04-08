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
