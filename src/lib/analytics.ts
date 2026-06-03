import { captureCurrentAttribution, type AttributionTouch, type PaidPlatform, type PaidSignal, type TrafficType } from './attribution';

const CAPI_RELAY_URL = import.meta.env.VITE_CAPI_RELAY_URL || 'https://relay.kuruk.in/v1/events';
const ENABLE_BROWSER_RELAY = import.meta.env.VITE_ENABLE_BROWSER_RELAY === 'true';
const SITE_ID = import.meta.env.VITE_SITE_ID || 'kurukinleadflow';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID;
const CLIENT_IP_LOOKUP_URL = 'https://api.ipify.org?format=json';
const SESSION_STORAGE_KEY = 'kurukin_analytics_session_id';
const LEGACY_SESSION_STORAGE_KEY = 'kurukin_analytics_event_id';

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

export interface AnalyticsContext {
  eventId: string;
  sessionId: string;
  siteId: string;
  trafficType: TrafficType;
  paidConfirmed: boolean;
  paidPlatform: PaidPlatform;
  paidSignal: PaidSignal;
  paidIntent: boolean;
  currentUrl: string;
  landingUrl: string;
  pagePath: string;
  referrer: string | null;
  timestamp: string;
  fbclid: string | null;
  fbp: string | null;
  fbc: string | null;
  ttclid: string | null;
  ttp: string | null;
  ttclidCookie: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  client_ip: string | null;
  clientIp: string | null;
  userAgent: string | null;
  hasMetaSignal: boolean;
  hasTikTokSignal: boolean;
  firstTouch: AttributionTouch;
  lastTouch: AttributionTouch;
}

let cachedClientIp: string | null = null;
let clientIpPromise: Promise<string | null> | null = null;
let browserRelayDisabledLogged = false;
const sentTikTokPageViewsByPath = new Set<string>();

const isBrowserEnvironment = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

const devLog = (message: string): void => {
  if (import.meta.env.DEV) {
    console.log(message);
  }
};

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
};

const getSessionId = (): string => {
  if (!isBrowserEnvironment()) return generateUUID();

  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY) || generateUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
};

export function createAnalyticsEventId(eventName: string): string {
  const safeEventName = eventName.replace(/[^a-z0-9_]+/gi, '_').replace(/^_+|_+$/g, '') || 'event';
  return `${safeEventName}_${generateUUID()}`;
}

export async function captureClientIp(timeoutMs = 1500): Promise<string | null> {
  if (cachedClientIp) return cachedClientIp;
  if (clientIpPromise) return clientIpPromise;

  clientIpPromise = (async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(CLIENT_IP_LOOKUP_URL, {
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`IP lookup failed with status ${response.status}`);
      }

      const data = (await response.json()) as { ip?: unknown };
      const ip = typeof data.ip === 'string' ? data.ip.trim() : '';
      cachedClientIp = ip || null;
      return cachedClientIp;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Analytics] No se pudo capturar client_ip desde el navegador.', error);
      }
      return null;
    } finally {
      window.clearTimeout(timeout);
      clientIpPromise = null;
    }
  })();

  return clientIpPromise;
}

const canUseMetaBrowserPixel = (context: Pick<AnalyticsContext, 'paidPlatform' | 'paidConfirmed'>): boolean =>
  context.paidPlatform === 'meta' && context.paidConfirmed;

const canUseTikTokBrowserPixel = (context: Pick<AnalyticsContext, 'paidPlatform' | 'paidConfirmed'>): boolean =>
  context.paidPlatform === 'tiktok' && context.paidConfirmed;

const initMetaPixel = (): void => {
  if (!META_PIXEL_ID) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] VITE_META_PIXEL_ID no está configurado. Meta Pixel no será inicializado.');
    }
    return;
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
    devLog('[Analytics] Meta Pixel initialized');
  }
};

const initTikTokPixel = (): void => {
  if (!TIKTOK_PIXEL_ID) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] VITE_TIKTOK_PIXEL_ID no está configurado. TikTok Pixel no será inicializado.');
    }
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
    window.__kurukinTikTokPixelInitialized = true;
    devLog('[Analytics] TikTok Pixel initialized');
  }
};

export async function initPixels(): Promise<void> {
  void captureClientIp();

  const context = getAnalyticsContext('PageView', createAnalyticsEventId('PageView'));

  devLog(
    `[Attribution] trafficType=${context.trafficType} paidSignal=${context.paidSignal ?? 'none'} paidConfirmed=${context.paidConfirmed}`,
  );

  if (!context.paidConfirmed || context.paidPlatform === null || context.paidPlatform === 'unknown') {
    devLog('[Attribution] organic/direct detected, pixels disabled');
    return Promise.resolve();
  }

  if (canUseMetaBrowserPixel(context)) {
    initMetaPixel();
  }

  if (canUseTikTokBrowserPixel(context)) {
    initTikTokPixel();
  }

  return Promise.resolve();
}

export function getAnalyticsContext(eventName = 'Lead_Calificado', eventId = createAnalyticsEventId(eventName)): AnalyticsContext {
  const attribution = captureCurrentAttribution();
  const currentTouch = attribution.currentTouch;
  const ttclidForPayload = currentTouch.ttclid ?? currentTouch.ttclidCookie;
  const userAgent = isBrowserEnvironment() ? window.navigator.userAgent : null;
  const hasMetaSignal = canUseMetaBrowserPixel(currentTouch);
  const hasTikTokSignal = canUseTikTokBrowserPixel(currentTouch);

  return {
    eventId,
    sessionId: getSessionId(),
    siteId: SITE_ID,
    trafficType: currentTouch.trafficType,
    paidConfirmed: currentTouch.paidConfirmed,
    paidPlatform: currentTouch.paidPlatform,
    paidSignal: currentTouch.paidSignal,
    paidIntent: currentTouch.paidIntent,
    currentUrl: currentTouch.currentUrl,
    landingUrl: currentTouch.landingUrl,
    pagePath: currentTouch.pagePath,
    referrer: currentTouch.referrer,
    timestamp: currentTouch.timestamp,
    fbclid: currentTouch.fbclid,
    fbp: currentTouch.fbp,
    fbc: currentTouch.fbc,
    ttclid: ttclidForPayload,
    ttp: currentTouch.ttp,
    ttclidCookie: currentTouch.ttclidCookie,
    utm_source: currentTouch.utm_source,
    utm_medium: currentTouch.utm_medium,
    utm_campaign: currentTouch.utm_campaign,
    utm_content: currentTouch.utm_content,
    utm_term: currentTouch.utm_term,
    client_ip: cachedClientIp,
    clientIp: cachedClientIp,
    userAgent,
    hasMetaSignal,
    hasTikTokSignal,
    firstTouch: attribution.firstTouch,
    lastTouch: attribution.lastTouch,
  };
}

async function sendBrowserRelay(
  eventName: string,
  eventId: string,
  context: AnalyticsContext,
  userData: Record<string, any>,
  customData: Record<string, any>,
): Promise<void> {
  if (!ENABLE_BROWSER_RELAY) {
    if (!browserRelayDisabledLogged) {
      browserRelayDisabledLogged = true;
      devLog('[Analytics] Browser relay disabled for LeadFlow');
    }
    return;
  }

  const tiktokEventName = eventName === 'Lead_Calificado' ? 'CompleteRegistration' : eventName;
  const payload = {
    siteId: SITE_ID,
    event_name: eventName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: context.currentUrl,
    action_source: 'website',
    user_data: {
      client_ip: context.client_ip,
      client_user_agent: context.userAgent,
      fbclid: context.fbclid,
      fbp: context.fbp,
      fbc: context.fbc,
      ttclid: context.ttclid,
      ttp: context.ttp,
      ...userData,
    },
    custom_data: {
      ...customData,
      trafficType: context.trafficType,
      paidConfirmed: context.paidConfirmed,
      paidPlatform: context.paidPlatform,
      paidSignal: context.paidSignal,
    },
    platforms: {
      meta: context.hasMetaSignal
        ? {
            pixel_id: META_PIXEL_ID || null,
            event_name: eventName,
            event_id: eventId,
            fbclid: context.fbclid,
            fbp: context.fbp,
            fbc: context.fbc,
          }
        : null,
      tiktok: context.hasTikTokSignal
        ? {
            pixel_id: TIKTOK_PIXEL_ID || null,
            event_name: tiktokEventName,
            event_id: eventId,
            ttclid: context.ttclid,
            ttp: context.ttp,
          }
        : null,
    },
  };

  const response = await fetch(CAPI_RELAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://kurukin.com',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 202 || response.ok) {
    devLog(`[CAPI Server-Side] Evento '${eventName}' enviado con éxito al Relay.`);
  } else if (import.meta.env.DEV) {
    console.warn(`[CAPI Server-Side] El Relay rechazó el evento '${eventName}' con estatus: ${response.status}`);
  }
}

export async function trackEvent(
  eventName: string,
  customEventId?: string,
  userData: Record<string, any> = {},
  customData: Record<string, any> = {},
): Promise<void> {
  const finalEventId = customEventId || createAnalyticsEventId(eventName);
  const context = getAnalyticsContext(eventName, finalEventId);
  const browserTasks: Promise<void>[] = [];

  if (eventName === 'Lead_Calificado' && !customData.clasificacion) {
    devLog('[Analytics] Lead_Calificado blocked: not qualified');
    return Promise.resolve();
  }

  if (!context.paidConfirmed || context.paidPlatform === null || context.paidPlatform === 'unknown') {
    devLog(`[Analytics] ${eventName} blocked: not paid confirmed`);
    return Promise.resolve();
  }

  if (canUseMetaBrowserPixel(context)) {
    initMetaPixel();
    if (eventName === 'Lead_Calificado') {
      browserTasks.push(Promise.resolve().then(() => {
        window.fbq?.('trackCustom', 'Lead_Calificado', customData, { eventID: finalEventId });
      }));
    } else {
      browserTasks.push(Promise.resolve().then(() => {
        window.fbq?.('track', eventName, customData, { eventID: finalEventId });
      }));
    }
  }

  if (canUseTikTokBrowserPixel(context)) {
    initTikTokPixel();
    if (eventName === 'Lead_Calificado') {
      browserTasks.push(Promise.resolve().then(() => {
        window.ttq?.track?.('CompleteRegistration', { ...customData }, { event_id: finalEventId });
      }));
    } else if (eventName === 'PageView') {
      const pageViewKey = context.pagePath || context.currentUrl;
      if (!sentTikTokPageViewsByPath.has(pageViewKey)) {
        sentTikTokPageViewsByPath.add(pageViewKey);
        browserTasks.push(Promise.resolve().then(() => {
          window.ttq?.page?.();
        }));
      } else {
        devLog(`[Analytics] TikTok PageView skipped: already sent for ${pageViewKey}`);
      }
    }
  }

  browserTasks.push(sendBrowserRelay(eventName, finalEventId, context, userData, customData));

  try {
    await Promise.all(browserTasks);
    if (eventName === 'Lead_Calificado') {
      devLog('[Analytics] Lead_Calificado browser sent');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[Analytics] Error al disparar el evento '${eventName}':`, error);
    }
  }
}

export async function trackPageView(): Promise<void> {
  return trackEvent('PageView', createAnalyticsEventId('PageView'));
}

export async function trackSubmitForm(customEventId?: string, userData?: Record<string, any>): Promise<void> {
  return trackEvent('SubmitForm', customEventId, userData);
}

export async function trackQualifiedLead(
  customEventId?: string,
  userData?: Record<string, any>,
  classification?: string,
): Promise<void> {
  if (classification !== 'ORO' && classification !== 'PLATA') {
    devLog('[Analytics] Lead_Calificado blocked: not qualified');
    return Promise.resolve();
  }

  return trackEvent('Lead_Calificado', customEventId, userData, {
    content_name: 'qualified_lead',
    value: 10,
    currency: 'USD',
    clasificacion: classification,
  });
}

export async function trackLead(customEventId?: string, userData?: Record<string, any>): Promise<void> {
  return trackEvent('Lead', customEventId, userData);
}
