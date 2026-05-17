// src/lib/analytics.ts

const CAPI_RELAY_URL = import.meta.env.VITE_CAPI_RELAY_URL || 'https://relay.kuruk.in/v1/events';
const SITE_ID = import.meta.env.VITE_SITE_ID || 'KURUKIN';

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

// 1. Inicialización limpia (Reemplaza la carga de scripts de Meta y TikTok)
export async function initPixels(): Promise<void> {
  console.log(`[Analytics] Sistema inicializado en modo Relay Server-Side para el tenant: ${SITE_ID}`);
  // No inyectamos scripts de terceros. El navegador queda limpio y libre de bloqueos.
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

  const payload = {
    siteId: SITE_ID,
    event_name: eventName,
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
      console.log(`[CAPI Server-Side] Evento '${eventName}' enviado con éxito al Relay.`);
    } else {
      console.warn(`[CAPI Server-Side] El Relay rechazó el evento '${eventName}' con estatus: ${response.status}`);
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
  // TikTok espera 'SubmitForm', Meta espera 'Lead' -> El relay se encarga del mapeo interno por canal
  return trackEvent('SubmitForm', customEventId, userData);
}

export async function trackQualifiedLead(customEventId?: string, userData?: Record<string, any>, classification?: string): Promise<void> {
  return trackEvent('CompleteRegistration', customEventId, userData, {
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