const DEFAULT_SITE_ID = 'kurukinleadflow';
const SESSION_EVENT_ID_KEY = 'kurukin.analytics.session_event_id.v1';
const STORAGE_PREFIX = 'leadflow.capi';
const META_PIXEL_SCRIPT_ID = 'kurukin-meta-pixel-script';
const META_PIXEL_SCRIPT_URL = 'https://connect.facebook.net/en_US/fbevents.js';
const TIKTOK_PIXEL_SCRIPT_ID = 'kurukin-tiktok-pixel-script';
const TIKTOK_PIXEL_SCRIPT_URL = 'https://analytics.tiktok.com/i18n/pixel/events.js';
const META_FBC_COOKIE_NAME = '_fbc';
const META_FBP_COOKIE_NAME = '_fbp';
const TIKTOK_TTCLID_COOKIE_NAME = 'ttclid';

type PixelMethod = 'track' | 'trackCustom';
type MetaFbqQueueEntry = readonly unknown[];

interface MetaFbqFunction {
  (...args: readonly unknown[]): void;
  queue?: MetaFbqQueueEntry[];
  loaded?: boolean;
  version?: string;
  callMethod?: (...args: readonly unknown[]) => void;
}

interface TikTokTrackFunction {
  (...args: readonly unknown[]): void;
}

interface TikTokPixelQueue extends Array<unknown> {
  track?: TikTokTrackFunction;
  identify?: (payload: Record<string, string>) => void;
  load?: (pixelId: string, options?: Record<string, unknown>) => void;
  page?: () => void;
  methods?: string[];
  setAndDefer?: (target: TikTokPixelQueue, method: string) => void;
  instance?: (pixelId: string) => TikTokPixelQueue;
  _i?: Record<string, TikTokPixelQueue & { _u?: string }>;
  _o?: Record<string, Record<string, unknown>>;
  _t?: Record<string, number>;
}

declare global {
  interface Window {
    fbq?: MetaFbqFunction;
    _fbq?: MetaFbqFunction;
    TiktokAnalyticsObject?: string;
    ttq?: TikTokPixelQueue;
  }
}

export interface ClickIdentifiers {
  fbc: string | null;
  fbp: string | null;
  ttclid: string | null;
}

export interface AnalyticsContext extends ClickIdentifiers {
  eventId: string;
  siteId: string;
}

export interface TrackEventData {
  eventId?: string;
  browser?: Record<string, unknown>;
  metaEventName?: string;
  tiktokEventName?: string;
}

export interface TrackEventResult {
  eventId: string;
  browserSent: {
    meta: boolean;
    tiktok: boolean;
  };
  reason: string | null;
}

export interface TrackLeadInput {
  eventId?: string;
  value?: number;
  currency?: string;
}

export interface TrackStandardEventInput {
  eventId?: string;
  browser?: Record<string, unknown>;
}

type StandardAnalyticsEvent = 'submit_form' | 'qualified_lead';

interface StandardAnalyticsEventConfig {
  metaEventName: string;
  tiktokEventName: string;
  browser: Record<string, unknown>;
}

const STANDARD_EVENTS: Record<StandardAnalyticsEvent, StandardAnalyticsEventConfig> = {
  submit_form: {
    metaEventName: 'Lead',
    tiktokEventName: 'SubmitForm',
    browser: {
      content_name: 'submit_form',
    },
  },
  qualified_lead: {
    metaEventName: 'CompleteRegistration',
    tiktokEventName: 'CompleteRegistration',
    browser: {
      content_name: 'qualified_lead',
      value: 10,
      currency: 'USD',
    },
  },
};

export interface PixelInitResult {
  meta: boolean;
  tiktok: boolean;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
}

let metaScriptPromise: Promise<void> | null = null;
let tiktokScriptPromise: Promise<void> | null = null;
let initializedMetaPixelId: string | null = null;
let initializedTiktokPixelId: string | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function normalizeNullable(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readCookieValue(name: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  const encodedName = `${name}=`;
  const target = document.cookie.split('; ').find((segment) => segment.startsWith(encodedName));

  if (!target) {
    return null;
  }

  return normalizeNullable(decodeURIComponent(target.slice(encodedName.length)));
}

function writeCookieValue(name: string, value: string, days = 90): void {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function readStorageValue(key: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    return normalizeNullable(window.localStorage.getItem(key)) ?? normalizeNullable(window.sessionStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage may be blocked by browser privacy settings.
  }
}

function createUuid(): string {
  const cryptoObject = globalThis.crypto;

  if (typeof cryptoObject !== 'undefined' && typeof cryptoObject.randomUUID === 'function') {
    return cryptoObject.randomUUID();
  }

  const randomChunk = Math.random().toString(36).slice(2, 12);
  return `evt_${Date.now()}_${randomChunk}`;
}

function getSessionEventId(): string {
  if (!isBrowser()) {
    return createUuid();
  }

  try {
    const existingEventId = normalizeNullable(window.sessionStorage.getItem(SESSION_EVENT_ID_KEY));

    if (existingEventId) {
      return existingEventId;
    }

    const nextEventId = createUuid();
    window.sessionStorage.setItem(SESSION_EVENT_ID_KEY, nextEventId);
    return nextEventId;
  } catch {
    return createUuid();
  }
}

function createMetaFbc(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`;
}

function createMetaFbp(): string {
  const randomId = Math.floor(Math.random() * 10 ** 10);
  return `fb.1.${Date.now()}.${randomId}`;
}

export function captureClickIdentifiers(): ClickIdentifiers {
  if (!isBrowser()) {
    return { fbc: null, fbp: null, ttclid: null };
  }

  const params = new URLSearchParams(window.location.search);
  const fbclid = normalizeNullable(params.get('fbclid'));
  const ttclidParam = normalizeNullable(params.get('ttclid'));
  const storedFbc = readStorageValue(`${STORAGE_PREFIX}.fbc`);
  const storedFbp = readStorageValue(`${STORAGE_PREFIX}.fbp`);
  const storedTtclid = readStorageValue(`${STORAGE_PREFIX}.ttclid`);
  const cookieFbc = readCookieValue(META_FBC_COOKIE_NAME);
  const cookieFbp = readCookieValue(META_FBP_COOKIE_NAME);
  const cookieTtclid = readCookieValue(TIKTOK_TTCLID_COOKIE_NAME) ?? readCookieValue('ttc');

  const fbc = cookieFbc ?? storedFbc ?? (fbclid ? createMetaFbc(fbclid) : null);
  const fbp = cookieFbp ?? storedFbp ?? createMetaFbp();
  const ttclid = ttclidParam ?? cookieTtclid ?? storedTtclid;

  if (fbc) {
    writeStorageValue(`${STORAGE_PREFIX}.fbc`, fbc);
    if (!cookieFbc) {
      writeCookieValue(META_FBC_COOKIE_NAME, fbc);
    }
  }

  if (fbp) {
    writeStorageValue(`${STORAGE_PREFIX}.fbp`, fbp);
    if (!cookieFbp) {
      writeCookieValue(META_FBP_COOKIE_NAME, fbp);
    }
  }

  if (ttclid) {
    writeStorageValue(`${STORAGE_PREFIX}.ttclid`, ttclid);
    if (!cookieTtclid) {
      writeCookieValue(TIKTOK_TTCLID_COOKIE_NAME, ttclid);
    }
  }

  return { fbc, fbp, ttclid };
}

function resolveEnvValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function resolveSiteId(): string {
  return resolveEnvValue(import.meta.env.VITE_SITE_ID) ?? DEFAULT_SITE_ID;
}

function ensureFbqStub(): MetaFbqFunction | null {
  if (!isBrowser()) {
    return null;
  }

  if (typeof window.fbq === 'function') {
    return window.fbq;
  }

  const fbq: MetaFbqFunction = (...args: readonly unknown[]) => {
    if (typeof fbq.callMethod === 'function') {
      fbq.callMethod(...args);
      return;
    }

    const queue = Array.isArray(fbq.queue) ? [...fbq.queue] : [];
    queue.push(args);
    fbq.queue = queue;
  };

  fbq.queue = [];
  fbq.loaded = false;
  fbq.version = '2.0';
  window.fbq = fbq;
  window._fbq = fbq;
  return fbq;
}

function loadMetaPixel(pixelId: string | null): Promise<void> {
  if (!isBrowser() || !pixelId) {
    return Promise.resolve();
  }

  const fbq = ensureFbqStub();

  if (fbq && initializedMetaPixelId !== pixelId) {
    fbq('init', pixelId);
    initializedMetaPixelId = pixelId;
  }

  if (document.getElementById(META_PIXEL_SCRIPT_ID)) {
    return Promise.resolve();
  }

  if (metaScriptPromise) {
    return metaScriptPromise;
  }

  metaScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = META_PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = META_PIXEL_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Meta Pixel script.'));
    document.head.appendChild(script);
  });

  return metaScriptPromise;
}

function injectTiktokScript(pixelId: string): Promise<void> {
  if (!isBrowser() || !pixelId) {
    return Promise.resolve();
  }

  if (document.getElementById(TIKTOK_PIXEL_SCRIPT_ID)) {
    return Promise.resolve();
  }

  if (tiktokScriptPromise) {
    return tiktokScriptPromise;
  }

  tiktokScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = TIKTOK_PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = `${TIKTOK_PIXEL_SCRIPT_URL}?sdkid=${encodeURIComponent(pixelId)}&lib=ttq`;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load TikTok Pixel script.'));

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
      return;
    }

    document.head.appendChild(script);
  });

  return tiktokScriptPromise;
}

function loadTiktokPixel(pixelId: string | null): Promise<void> {
  if (!isBrowser() || !pixelId) {
    return Promise.resolve();
  }

  const ttq = ensureTiktokStub();
  if (!ttq) {
    return Promise.resolve();
  }

  if (initializedTiktokPixelId !== pixelId) {
    ttq.load?.(pixelId);
    initializedTiktokPixelId = pixelId;
  }

  return tiktokScriptPromise ?? Promise.resolve();
}

function ensureTiktokStub(): TikTokPixelQueue | null {
  if (!isBrowser()) {
    return null;
  }

  window.TiktokAnalyticsObject = 'ttq';
  const existing = window.ttq as TikTokPixelQueue | undefined;

  if (existing && typeof existing.load === 'function' && typeof existing.track === 'function') {
    return existing;
  }

  const ttq = Array.isArray(existing) ? existing : ([] as unknown as TikTokPixelQueue);
  ttq.methods = [
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
  ttq.setAndDefer = (target: TikTokPixelQueue, method: string) => {
    (target as unknown as Record<string, unknown>)[method] = (...args: readonly unknown[]) => {
      target.push([method, ...args]);
    };
  };

  ttq.methods.forEach((method) => {
    ttq.setAndDefer?.(ttq, method);
  });

  ttq.instance = (pixelId: string): TikTokPixelQueue => {
    const instanceQueue = (ttq._i?.[pixelId] ?? []) as TikTokPixelQueue;
    ttq.methods?.forEach((method) => {
      ttq.setAndDefer?.(instanceQueue, method);
    });
    return instanceQueue;
  };

  ttq.load = (nextPixelId: string, options: Record<string, unknown> = {}) => {
    const instanceQueue = [] as unknown as TikTokPixelQueue & { _u?: string };
    instanceQueue._u = TIKTOK_PIXEL_SCRIPT_URL;
    ttq._i = {
      ...(ttq._i ?? {}),
      [nextPixelId]: instanceQueue,
    };
    ttq._t = {
      ...(ttq._t ?? {}),
      [nextPixelId]: Date.now(),
    };
    ttq._o = {
      ...(ttq._o ?? {}),
      [nextPixelId]: options,
    };

    void injectTiktokScript(nextPixelId);
  };

  window.ttq = ttq;
  return ttq;
}

async function dispatchBrowserPixels({
  eventName,
  eventId,
  data,
}: {
  eventName: string;
  eventId: string;
  data: TrackEventData;
}): Promise<TrackEventResult['browserSent']> {
  if (!isBrowser()) {
    return { meta: false, tiktok: false };
  }

  const metaPixelId = resolveEnvValue(import.meta.env.VITE_META_PIXEL_ID);
  const tiktokPixelId = resolveEnvValue(import.meta.env.VITE_TIKTOK_PIXEL_ID);
  const browserParams = data.browser ?? {};
  const metaEventName = data.metaEventName ?? eventName;
  const tiktokEventName = data.tiktokEventName ?? eventName;
  const metaMethod: PixelMethod = metaEventName === eventName ? 'track' : 'trackCustom';

  let meta = false;
  let tiktok = false;

  try {
    await loadMetaPixel(metaPixelId);
    if (typeof window.fbq === 'function') {
      window.fbq(metaMethod, metaEventName, browserParams, { eventID: eventId });
      meta = true;
    }
  } catch (error) {
    console.error('[analytics] Meta pixel failed', error);
  }

  try {
    await loadTiktokPixel(tiktokPixelId);
    if (typeof window.ttq?.track === 'function') {
      window.ttq.track(tiktokEventName, browserParams, { event_id: eventId });
      tiktok = true;
    }
  } catch (error) {
    console.error('[analytics] TikTok pixel failed', error);
  }

  return { meta, tiktok };
}

export async function initPixels(): Promise<PixelInitResult> {
  const metaPixelId = resolveEnvValue(import.meta.env.VITE_META_PIXEL_ID);
  const tiktokPixelId = resolveEnvValue(import.meta.env.VITE_TIKTOK_PIXEL_ID);

  const [meta, tiktok] = await Promise.all([
    loadMetaPixel(metaPixelId)
      .then(() => Boolean(metaPixelId && typeof window.fbq === 'function'))
      .catch((error) => {
        console.error('[analytics] Meta pixel init failed', error);
        return false;
      }),
    loadTiktokPixel(tiktokPixelId)
      .then(() => Boolean(tiktokPixelId && typeof window.ttq?.load === 'function'))
      .catch((error) => {
        console.error('[analytics] TikTok pixel init failed', error);
        return false;
      }),
  ]);

  return {
    meta,
    tiktok,
    metaPixelId,
    tiktokPixelId,
  };
}

export async function trackPageView(eventId = getSessionEventId()): Promise<TrackEventResult> {
  await initPixels();

  let meta = false;
  let tiktok = false;

  if (isBrowser() && typeof window.fbq === 'function') {
    window.fbq('track', 'PageView', {}, { eventID: eventId });
    meta = true;
  }

  if (isBrowser() && typeof window.ttq?.page === 'function') {
    window.ttq.page();
    tiktok = true;
  }

  return {
    eventId,
    browserSent: {
      meta,
      tiktok,
    },
    reason: null,
  };
}

export function getAnalyticsContext(): AnalyticsContext {
  return {
    eventId: getSessionEventId(),
    siteId: resolveSiteId(),
    ...captureClickIdentifiers(),
  };
}

export async function trackEvent(name: string, data: TrackEventData = {}): Promise<TrackEventResult> {
  const eventId = data.eventId ?? getSessionEventId();
  const browserSent = await dispatchBrowserPixels({ eventName: name, eventId, data });

  return {
    eventId,
    browserSent,
    reason: null,
  };
}

function trackStandardEvent(
  standardEvent: StandardAnalyticsEvent,
  input: TrackStandardEventInput = {},
): Promise<TrackEventResult> {
  const config = STANDARD_EVENTS[standardEvent];

  return trackEvent(config.metaEventName, {
    eventId: input.eventId,
    metaEventName: config.metaEventName,
    tiktokEventName: config.tiktokEventName,
    browser: {
      ...config.browser,
      ...input.browser,
    },
  });
}

export function trackSubmitForm(input: TrackStandardEventInput = {}): Promise<TrackEventResult> {
  return trackStandardEvent('submit_form', input);
}

export function trackQualifiedLead(input: TrackStandardEventInput = {}): Promise<TrackEventResult> {
  return trackStandardEvent('qualified_lead', {
    ...input,
    browser: {
      ...input.browser,
      content_name: 'qualified_lead',
      value: 10,
      currency: 'USD',
    },
  });
}

export function trackLead(input: TrackLeadInput = {}): Promise<TrackEventResult> {
  return trackQualifiedLead({
    eventId: input.eventId,
    browser: {
      value: input.value ?? 10,
      currency: input.currency ?? 'USD',
    },
  });
}
