// src/lib/analytics.ts

const CAPI_RELAY_URL = import.meta.env.VITE_CAPI_RELAY_URL || 'https://relay.kuruk.in/v1/events';
const SITE_ID = import.meta.env.VITE_SITE_ID || 'KURUKIN';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

type FbqFunction = {
  (...args: any[]): void;
  callMethod?: (...args: any[]) => void;
  push?: FbqFunction;
  loaded?: boolean;
  version?: string;
  queue?: any[];
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    __kurukinMetaPixelInitialized?: boolean;
  }
}

// Helper para extraer cookies de Meta/TikTok del navegador
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Generador de UUID para persistir el eventId por sesión
const generateUUID = (): string => {
  return crypto.randomUUID();
};

// Guardar un único eventId en el sessionStorage para asegurar consistencia
const getSessionEventId = (): string => {
  let eventId = sessionStorage.getItem('kurukin_analytics_event_id');
  if (!eventId) {
    eventId = generateUUID();
    sessionStorage.setItem('kurukin_analytics_event_id', eventId);
  }
  return eventId;
};

interface AnalyticsContext {
  eventId: string;
  siteId: string;
  fbp: string | null;
  fbc: string | null;
  ttclid: string | null;
}

// 1. Inicialización híbrida: Browser Pixel + CAPI Relay
export async function initPixels(): Promise<void> {
  if (!META_PIXEL_ID) {
    console.warn('[Analytics] VITE_META_PIXEL_ID no está configurado. Meta Pixel no será inicializado.');
    return Promise.resolve();
  }

  if (!window.fbq) {
    const fbq = function (...args: any[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue?.push(args);
      }
    } as FbqFunction;

    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
  }

  if (!document.querySelector('script[src="https://connect.facebook.net/en_US/fbevents.js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  if (!window.__kurukinMetaPixelInitialized) {
    window.fbq('init', META_PIXEL_ID);
    window.__kurukinMetaPixelInitialized = true;
  }

  console.log(`[Analytics] Sistema inicializado en modo híbrido Browser Pixel + CAPI para el tenant: ${SITE_ID}`);
  return Promise.resolve();
}

// 2. Captura y persistencia de contexto analítico para n8n/formularios
export function getAnalyticsContext(): AnalyticsContext {
  // Extraer parámetros URL si existen en el aterrizaje
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  const ttclidParam = urlParams.get('ttclid');

  // Priorizar cookies existentes o parámetros URL
  const fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }

  const ttclid = ttclidParam || getCookie('ttclid');

  return {
    eventId: getSessionEventId(),
    siteId: SITE_ID,
    fbp,
    fbc,
    ttclid
  };
}

// 3. Despachador maestro hacia el kurukin-relay
export async function trackEvent(
  eventName: string, 
  customEventId?: string, 
  userData: Record<string, any> = {}, 
  customData: Record<string, any> = {}
): Promise<void> {
  const context = getAnalyticsContext();
  const finalEventId = customEventId || context.eventId;
  const metaEventName = eventName;

  if (metaEventName === 'Lead_Calificado') {
    window.fbq?.('trackCustom', 'Lead_Calificado', customData, { eventID: finalEventId });
  } else {
    window.fbq?.('track', metaEventName, customData, { eventID: finalEventId });
  }

  const payload = {
    siteId: SITE_ID,
    event_name: metaEventName,
    event_id: finalEventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: window.location.href,
    action_source: 'website',
    user_data: {
      fbp: context.fbp,
      fbc: context.fbc,
      ttclid: context.ttclid,
      ...userData
    },
    custom_data: {
      ...customData
    }
  };

  try {
    const response = await fetch(CAPI_RELAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://kurukin.com' // Validado por CORS en el microservicio
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 202 || response.ok) {
      console.log(`[CAPI Server-Side] Evento '${metaEventName}' enviado con éxito al Relay.`);
    } else {
      console.warn(`[CAPI Server-Side] El Relay rechazó el evento '${metaEventName}' con estatus: ${response.status}`);
    }
  } catch (error) {
    console.error(`[CAPI Server-Side] Error al conectar con el servidor de eventos:`, error);
  }
}

// 4. Mapeo de funciones heredadas (Mantienen la compatibilidad con el resto de la App)
export async function trackPageView(): Promise<void> {
  return trackEvent('PageView');
}

export async function trackSubmitForm(customEventId?: string, userData?: Record<string, any>): Promise<void> {
  // Mantiene compatibilidad sin convertir formularios enviados en leads calificados.
  return trackEvent('SubmitForm', customEventId, userData);
}

export async function trackQualifiedLead(customEventId?: string, userData?: Record<string, any>, classification?: string): Promise<void> {
  return trackEvent('Lead_Calificado', customEventId, userData, {
    content_name: 'qualified_lead',
    value: 10,
    currency: 'USD',
    clasificacion: classification || 'Aprobado'
  });
}

// Fallback por si algún componente antiguo llama a trackLead
export async function trackLead(customEventId?: string, userData?: Record<string, any>): Promise<void> {
  return trackEvent('Lead', customEventId, userData);
}
