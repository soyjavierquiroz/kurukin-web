const ATTRIBUTION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const STORAGE_KEYS = {
  currentTouch: 'kurukin_attribution_current_touch',
  firstTouch: 'kurukin_attribution_first_touch',
  lastTouch: 'kurukin_attribution_last_touch',
} as const;

const PAID_MEDIUMS = new Set(['paid', 'paid_social', 'cpc', 'ads']);
const META_SOURCES = new Set(['meta', 'facebook', 'instagram']);
const SOCIAL_REFERRER_HOSTS = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'youtube.com',
  'youtu.be',
  'x.com',
  'twitter.com',
];

export type TrafficType =
  | 'meta_paid'
  | 'tiktok_paid'
  | 'paid_unknown'
  | 'organic_social'
  | 'whatsapp'
  | 'referral'
  | 'direct'
  | 'unknown';

export type PaidPlatform = 'meta' | 'tiktok' | 'unknown' | null;
export type PaidSignal = 'fbclid' | 'ttclid' | 'utm_paid' | null;

export interface TrafficClassification {
  trafficType: TrafficType;
  paidConfirmed: boolean;
  paidPlatform: PaidPlatform;
  paidSignal: PaidSignal;
  paidIntent: boolean;
}

export interface AttributionInput {
  currentUrl: string;
  landingUrl: string;
  pagePath: string;
  referrer: string | null;
  timestamp: string;
  fbclid: string | null;
  ttclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbc: string | null;
  fbp: string | null;
  ttp: string | null;
  ttclidCookie: string | null;
}

export interface AttributionTouch extends AttributionInput, TrafficClassification {
  expiresAt: number;
}

interface StoredTouch {
  expiresAt: number;
  value: AttributionTouch;
}

export interface AttributionState {
  currentTouch: AttributionTouch;
  firstTouch: AttributionTouch;
  lastTouch: AttributionTouch;
}

const isBrowserEnvironment = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

const normalizeNullable = (value: string | null): string | null => {
  if (value === null) return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeKey = (value: string | null): string =>
  normalizeNullable(value)?.toLowerCase() ?? '';

const getCookie = (name: string): string | null => {
  if (!isBrowserEnvironment()) return null;

  const encodedName = `${name}=`;
  const segment = document.cookie.split('; ').find((part) => part.startsWith(encodedName));
  if (!segment) return null;

  const rawValue = segment.substring(encodedName.length);
  try {
    return normalizeNullable(decodeURIComponent(rawValue));
  } catch {
    return normalizeNullable(rawValue);
  }
};

const setCookie = (name: string, value: string): void => {
  if (!isBrowserEnvironment()) return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ATTRIBUTION_TTL_MS / 1000}; SameSite=Lax${secure}`;
};

const getReferrerHost = (referrer: string | null): string | null => {
  if (!referrer) return null;

  try {
    return new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const isSocialReferrer = (referrer: string | null): boolean => {
  const host = getReferrerHost(referrer);
  if (!host) return false;

  return SOCIAL_REFERRER_HOSTS.some((socialHost) => host === socialHost || host.endsWith(`.${socialHost}`));
};

const hasUtmSignal = (input: Pick<AttributionInput, 'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content' | 'utm_term'>): boolean =>
  Boolean(input.utm_source || input.utm_medium || input.utm_campaign || input.utm_content || input.utm_term);

export function classifyCurrentTraffic(input: AttributionInput): TrafficClassification {
  const source = normalizeKey(input.utm_source);
  const medium = normalizeKey(input.utm_medium);
  const hasPaidMedium = PAID_MEDIUMS.has(medium);

  if (input.fbclid) {
    return {
      trafficType: 'meta_paid',
      paidConfirmed: true,
      paidPlatform: 'meta',
      paidSignal: 'fbclid',
      paidIntent: true,
    };
  }

  if (input.ttclid) {
    return {
      trafficType: 'tiktok_paid',
      paidConfirmed: true,
      paidPlatform: 'tiktok',
      paidSignal: 'ttclid',
      paidIntent: true,
    };
  }

  if (META_SOURCES.has(source) && hasPaidMedium) {
    return {
      trafficType: 'meta_paid',
      paidConfirmed: true,
      paidPlatform: 'meta',
      paidSignal: 'utm_paid',
      paidIntent: true,
    };
  }

  if (source === 'tiktok' && hasPaidMedium) {
    return {
      trafficType: 'tiktok_paid',
      paidConfirmed: true,
      paidPlatform: 'tiktok',
      paidSignal: 'utm_paid',
      paidIntent: true,
    };
  }

  if (hasPaidMedium) {
    return {
      trafficType: 'paid_unknown',
      paidConfirmed: true,
      paidPlatform: 'unknown',
      paidSignal: 'utm_paid',
      paidIntent: true,
    };
  }

  if (source === 'whatsapp' || medium === 'message') {
    return {
      trafficType: 'whatsapp',
      paidConfirmed: false,
      paidPlatform: null,
      paidSignal: null,
      paidIntent: false,
    };
  }

  if (medium === 'organic' || isSocialReferrer(input.referrer)) {
    return {
      trafficType: 'organic_social',
      paidConfirmed: false,
      paidPlatform: null,
      paidSignal: null,
      paidIntent: false,
    };
  }

  if (!input.referrer && !hasUtmSignal(input)) {
    return {
      trafficType: 'direct',
      paidConfirmed: false,
      paidPlatform: null,
      paidSignal: null,
      paidIntent: false,
    };
  }

  if (input.referrer && !hasPaidMedium) {
    return {
      trafficType: 'referral',
      paidConfirmed: false,
      paidPlatform: null,
      paidSignal: null,
      paidIntent: false,
    };
  }

  return {
    trafficType: 'unknown',
    paidConfirmed: false,
    paidPlatform: null,
    paidSignal: null,
    paidIntent: false,
  };
}

const readStoredTouch = (key: string, now = Date.now()): AttributionTouch | null => {
  if (!isBrowserEnvironment()) return null;

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return null;

    const stored = JSON.parse(rawValue) as Partial<StoredTouch>;
    if (!stored.value || typeof stored.expiresAt !== 'number' || stored.expiresAt <= now) {
      window.localStorage.removeItem(key);
      return null;
    }

    return stored.value;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
};

const writeStoredTouch = (key: string, value: AttributionTouch): void => {
  if (!isBrowserEnvironment()) return;

  const stored: StoredTouch = {
    expiresAt: value.expiresAt,
    value,
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(stored));
  } catch {
    // Ignore storage failures in private mode or constrained browsers.
  }
};

const shouldUpdateLastTouch = (touch: AttributionTouch, previous: AttributionTouch | null): boolean => {
  if (!previous) return true;
  if (touch.fbclid || touch.ttclid || touch.paidIntent) return true;
  if (hasUtmSignal(touch)) return true;
  if (touch.referrer && touch.trafficType !== 'direct') return true;

  return false;
};

export function captureCurrentAttribution(): AttributionState {
  if (!isBrowserEnvironment()) {
    const now = new Date().toISOString();
    const fallbackInput: AttributionInput = {
      currentUrl: '',
      landingUrl: '',
      pagePath: '',
      referrer: null,
      timestamp: now,
      fbclid: null,
      ttclid: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      fbc: null,
      fbp: null,
      ttp: null,
      ttclidCookie: null,
    };
    const fallbackTouch = {
      ...fallbackInput,
      ...classifyCurrentTraffic(fallbackInput),
      expiresAt: Date.now() + ATTRIBUTION_TTL_MS,
    };

    return {
      currentTouch: fallbackTouch,
      firstTouch: fallbackTouch,
      lastTouch: fallbackTouch,
    };
  }

  const now = Date.now();
  const timestamp = new Date(now).toISOString();
  const params = new URLSearchParams(window.location.search);
  const fbclid = normalizeNullable(params.get('fbclid'));
  const ttclid = normalizeNullable(params.get('ttclid'));
  let fbc = getCookie('_fbc');

  if (fbclid) {
    fbc = `fb.1.${now}.${fbclid}`;
    setCookie('_fbc', fbc);
  }

  if (ttclid) {
    setCookie('ttclid', ttclid);
  }

  const input: AttributionInput = {
    currentUrl: window.location.href,
    landingUrl: window.location.href,
    pagePath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    referrer: normalizeNullable(document.referrer),
    timestamp,
    fbclid,
    ttclid,
    utm_source: normalizeNullable(params.get('utm_source')),
    utm_medium: normalizeNullable(params.get('utm_medium')),
    utm_campaign: normalizeNullable(params.get('utm_campaign')),
    utm_content: normalizeNullable(params.get('utm_content')),
    utm_term: normalizeNullable(params.get('utm_term')),
    fbc,
    fbp: getCookie('_fbp'),
    ttp: getCookie('_ttp'),
    ttclidCookie: getCookie('ttclid') ?? getCookie('_ttclid'),
  };
  const currentTouch: AttributionTouch = {
    ...input,
    ...classifyCurrentTraffic(input),
    expiresAt: now + ATTRIBUTION_TTL_MS,
  };

  const previousFirstTouch = readStoredTouch(STORAGE_KEYS.firstTouch, now);
  const previousLastTouch = readStoredTouch(STORAGE_KEYS.lastTouch, now);
  const firstTouch = previousFirstTouch ?? currentTouch;
  const lastTouch = shouldUpdateLastTouch(currentTouch, previousLastTouch) ? currentTouch : previousLastTouch ?? currentTouch;

  writeStoredTouch(STORAGE_KEYS.currentTouch, currentTouch);
  writeStoredTouch(STORAGE_KEYS.firstTouch, firstTouch);
  writeStoredTouch(STORAGE_KEYS.lastTouch, lastTouch);

  return {
    currentTouch,
    firstTouch,
    lastTouch,
  };
}

export function getStoredAttribution(): {
  currentTouch: AttributionTouch | null;
  firstTouch: AttributionTouch | null;
  lastTouch: AttributionTouch | null;
} {
  const now = Date.now();

  return {
    currentTouch: readStoredTouch(STORAGE_KEYS.currentTouch, now),
    firstTouch: readStoredTouch(STORAGE_KEYS.firstTouch, now),
    lastTouch: readStoredTouch(STORAGE_KEYS.lastTouch, now),
  };
}
