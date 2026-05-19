// src/lib/analytics.ts

const CAPI_RELAY_URL = import.meta.env.VITE_CAPI_RELAY_URL || 'https://relay.kuruk.in/v1/events';
const SITE_ID = import.meta.env.VITE_SITE_ID || 'KURUKIN';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID;

type FbqFunction = {
  (...args: any[]): void;
  callMethod?: (...args: any[]) => void;
  push?: FbqFunction;
  loaded?: boolean;
  version?: string;
  queue?: any[];
};

type TtqFunction = {
  track?: (eventName: string, payload?: Record<string, any>, options?: Record<string, any>) => void;
  load?: (pixelId: string, options?: Record<string, any>) => void;
  page?: () => void;
  push?: (...args: any[]) => number;
  methods?: string[];
  setAndDefer?: (target: Record<string, any>, methodName: string) => void;
  instance?: (pixelId: string) => Record<string, any>;
  _i?: Record<string, any>;
  _t?: Record<string, number>;
  _o?: Record<string, Record<string, any>>;
  [key: string]: any;
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    __kurukinMetaPixelInitialized?: boolean;
    ttq?: TtqFunction;
    TiktokAnalyticsObject?: string;
    __kurukinTikTokPixelInitialized?: boolean;
  }
}

// Helper para extraer cookies de Meta/TikTok del navegador
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const setTrackingCookie = (name: string, value: string): void => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=7776000; SameSite=Lax`;
};

const extractFbclidFromFbc = (fbc: string | null): string | null => {
  if (!fbc) return null;

  const parts = fbc.split('.');
  return parts.length >= 4 ? parts.slice(3).join('.') || null : null;
};

interface PaidTrafficSignals {
  fbclid: string | null;
  fbclidParam: string | null;
  fbp: string | null;
  fbc: string | null;
  ttclid: string | null;
  ttclidParam: string | null;
  ttp: string | null;
}

const getPaidTrafficSignals = (): PaidTrafficSignals => {
  const urlParams = new URLSearchParams(window.location.search);
  const fbclidParam = urlParams.get('fbclid');
  const ttclidParam = urlParams.get('ttclid');
  const fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');

  if (!fbc && fbclidParam) {
    fbc = `fb.1.${Date.now()}.${fbclidParam}`;
    setTrackingCookie('_fbc', fbc);
  }

  if (ttclidParam) {
    setTrackingCookie('ttclid', ttclidParam);
  }

  return {
    fbclid: fbclidParam || extractFbclidFromFbc(fbc),
    fbclidParam,
    fbp,
    fbc,
    ttclid: ttclidParam || getCookie('ttclid') || getCookie('_ttclid'),
    ttclidParam,
    ttp: getCookie('_ttp')
  };
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
  fbclid: string | null;
  fbp: string | null;
  fbc: string | null;
  ttclid: string | null;
  ttp: string | null;
  hasMetaSignal: boolean;
  hasTikTokSignal: boolean;
}

const initMetaPixel = (): void => {
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
};

const initTikTokPixel = (): void => {
  if (!TIKTOK_PIXEL_ID) {
    console.warn('[Analytics] VITE_TIKTOK_PIXEL_ID no está configurado. TikTok Pixel no será inicializado.');
    return;
  }

  if (!window.ttq) {
    const ttq = [] as unknown as TtqFunction;
    const methods = [
      'page',
      'track',
      'identify',
      'instances',
      'debug',
      'on',
      'off',
      'once',
      'ready',
      'alias',
      'group',
      'enableCookie',
      'disableCookie',
      'holdConsent',
      'revokeConsent',
      'grantConsent',
    ];

    window.TiktokAnalyticsObject = 'ttq';
    ttq.methods = methods;
    ttq.setAndDefer = (target, methodName) => {
      target[methodName] = (...args: any[]) => {
        ttq.push?.([methodName, ...args]);
      };
    };

    methods.forEach((methodName) => {
      ttq.setAndDefer?.(ttq, methodName);
    });

    ttq.instance = (pixelId: string) => {
      ttq._i = ttq._i || {};
      ttq._i[pixelId] = ttq._i[pixelId] || [];
      methods.forEach((methodName) => {
        ttq.setAndDefer?.(ttq._i![pixelId], methodName);
      });
      return ttq._i[pixelId];
    };

    ttq.load = (pixelId: string, options: Record<string, any> = {}) => {
      ttq._i = ttq._i || {};
      ttq._i[pixelId] = [];
      ttq._i[pixelId]._u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._t = ttq._t || {};
      ttq._t[pixelId] = Date.now();
      ttq._o = ttq._o || {};
      ttq._o[pixelId] = options;

      if (document.querySelector(`script[src*="sdkid=${pixelId}"]`)) return;

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${pixelId}&lib=ttq`;
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    };

    window.ttq = ttq;
  }

  if (!window.__kurukinTikTokPixelInitialized) {
    window.ttq.load?.(TIKTOK_PIXEL_ID);
    window.ttq.page?.();
    window.__kurukinTikTokPixelInitialized = true;
  }
};

// 1. Inicialización híbrida con filtro de pago: Browser Pixels + CAPI Relay
export async function initPixels(): Promise<void> {
  const signals = getPaidTrafficSignals();

  if (!signals.fbclid && !signals.ttclid) {
    console.log('[Analytics] Tráfico Orgánico detected. Píxeles de Meta y TikTok desactivados para proteger algoritmos.');
    return Promise.resolve();
  }

  if (signals.fbclid) {
    if (META_PIXEL_ID) {
      initMetaPixel();
    } else {
      console.warn('[Analytics] VITE_META_PIXEL_ID no está configurado. Meta Pixel no será inicializado.');
    }
  }

  if (signals.ttclid) {
    initTikTokPixel();
  }

  console.log(`[Analytics] Sistema inicializado en modo Anti-Curiosos bi-plataforma para el tenant: ${SITE_ID}`);
  return Promise.resolve();
}

// 2. Captura y persistencia de contexto analítico para n8n/formularios
export function getAnalyticsContext(): AnalyticsContext {
  const signals = getPaidTrafficSignals();

  return {
    eventId: getSessionEventId(),
    siteId: SITE_ID,
    fbclid: signals.fbclid,
    fbp: signals.fbp,
    fbc: signals.fbc,
    ttclid: signals.ttclid,
    ttp: signals.ttp,
    hasMetaSignal: Boolean(signals.fbclid),
    hasTikTokSignal: Boolean(signals.ttclid)
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
  const tiktokEventName = metaEventName === 'Lead_Calificado' ? 'CompleteRegistration' : metaEventName;

  if (!context.hasMetaSignal && !context.hasTikTokSignal) {
    console.log(`[Analytics] Evento '${metaEventName}' bloqueado: no hay señal pagada fbclid/ttclid.`);
    return Promise.resolve();
  }

  const browserTasks: Promise<void>[] = [];

  if (metaEventName === 'Lead_Calificado' && context.hasMetaSignal) {
    browserTasks.push(Promise.resolve().then(() => {
      window.fbq?.('trackCustom', 'Lead_Calificado', customData, { eventID: finalEventId });
    }));
  } else if (context.hasMetaSignal) {
    browserTasks.push(Promise.resolve().then(() => {
      window.fbq?.('track', metaEventName, customData, { eventID: finalEventId });
    }));
  }

  if (metaEventName === 'Lead_Calificado' && context.hasTikTokSignal) {
    browserTasks.push(Promise.resolve().then(() => {
      window.ttq?.track?.('CompleteRegistration', { ...customData }, { event_id: finalEventId });
    }));
  } else if (context.hasTikTokSignal && metaEventName === 'PageView') {
    browserTasks.push(Promise.resolve().then(() => {
      window.ttq?.page?.();
    }));
  }

  const payload = {
    siteId: SITE_ID,
    event_name: metaEventName,
    event_id: finalEventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: window.location.href,
    action_source: 'website',
    user_data: {
      fbclid: context.fbclid,
      fbp: context.fbp,
      fbc: context.fbc,
      ttclid: context.ttclid,
      ttp: context.ttp,
      ...userData
    },
    custom_data: {
      ...customData
    },
    platforms: {
      meta: context.hasMetaSignal
        ? {
            pixel_id: META_PIXEL_ID || null,
            event_name: metaEventName,
            event_id: finalEventId,
            fbclid: context.fbclid,
            fbp: context.fbp,
            fbc: context.fbc
          }
        : null,
      tiktok: context.hasTikTokSignal
        ? {
            pixel_id: TIKTOK_PIXEL_ID || null,
            event_name: tiktokEventName,
            event_id: finalEventId,
            ttclid: context.ttclid,
            ttp: context.ttp
          }
        : null
    }
  };

  const relayTask = (async () => {
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
  })();

  try {
    await Promise.all([...browserTasks, relayTask]);
  } catch (error) {
    console.error(`[Analytics] Error al disparar el evento '${metaEventName}':`, error);
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
