import { useCallback, useEffect, useMemo, useState } from "react";
import { useAnalyticsStore } from "../store/useAnalyticsStore";
import type {
  MetaBrowserPayload,
  MetaEventName,
  MetaEventParams,
  MetaRelayPayload,
  MetaServerPayload,
  MetaStandardEventName,
} from "../types";

const META_PIXEL_SCRIPT_ID = "kurukin-meta-pixel-script";
const META_PIXEL_SCRIPT_URL = "https://connect.facebook.net/en_US/fbevents.js";

const META_STANDARD_EVENTS: ReadonlySet<MetaStandardEventName> = new Set([
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "AddToWishlist",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "CompleteRegistration",
  "Contact",
  "CustomizeProduct",
  "Donate",
  "FindLocation",
  "Schedule",
  "StartTrial",
  "SubmitApplication",
  "Subscribe",
]);

type MetaFbqQueueEntry = readonly unknown[];

interface MetaFbqFunction {
  (...args: readonly unknown[]): void;
  queue?: MetaFbqQueueEntry[];
  loaded?: boolean;
  version?: string;
  callMethod?: (...args: readonly unknown[]) => void;
}

declare global {
  interface Window {
    fbq?: MetaFbqFunction;
    _fbq?: MetaFbqFunction;
  }
}

export interface MetaTrackResult {
  eventID: string;
  browserSent: boolean;
  serverSent: boolean;
  serverStatus: number | null;
  skipped: boolean;
  reason: string | null;
}

export interface UseMetaPixelResult {
  isEnabled: boolean;
  isReady: boolean;
  pixelId: string | null;
  webhookUrl: string | null;
  track: <TEventName extends MetaEventName>(
    eventName: TEventName,
    params: MetaEventParams<TEventName>,
  ) => Promise<MetaTrackResult>;
}

let pixelScriptPromise: Promise<void> | null = null;
let initializedPixelId: string | null = null;

const isBrowserEnvironment = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

const normalizeEnvValue = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const resolvePixelId = (): string | null =>
  normalizeEnvValue(import.meta.env.VITE_META_PIXEL_ID);

const resolveWebhookUrl = (): string | null =>
  normalizeEnvValue(import.meta.env.VITE_CAPI_WEBHOOK_URL);

const createEventID = (): string => {
  const cryptoObject = globalThis.crypto;

  if (
    typeof cryptoObject !== "undefined" &&
    typeof cryptoObject.randomUUID === "function"
  ) {
    return cryptoObject.randomUUID();
  }

  const randomChunk = Math.random().toString(36).slice(2, 12);
  return `evt_${Date.now()}_${randomChunk}`;
};

const isMetaStandardEventName = (
  eventName: string,
): eventName is MetaStandardEventName =>
  META_STANDARD_EVENTS.has(eventName as MetaStandardEventName);

const ensureFbqStub = (): MetaFbqFunction => {
  if (!isBrowserEnvironment()) {
    throw new Error("fbq is only available in browser environments.");
  }

  if (typeof window.fbq === "function") {
    return window.fbq;
  }

  const fbq: MetaFbqFunction = (...args: readonly unknown[]) => {
    if (typeof fbq.callMethod === "function") {
      fbq.callMethod(...args);
      return;
    }

    if (!Array.isArray(fbq.queue)) {
      fbq.queue = [];
    }

    fbq.queue.push(args);
  };

  fbq.queue = [];
  fbq.loaded = false;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;
  return fbq;
};

const injectMetaPixelScript = async (pixelId: string): Promise<void> => {
  if (!isBrowserEnvironment()) {
    return;
  }

  const fbq = ensureFbqStub();

  if (initializedPixelId !== pixelId) {
    fbq("init", pixelId);
    initializedPixelId = pixelId;
  }

  const existingScript = document.getElementById(META_PIXEL_SCRIPT_ID);
  if (existingScript !== null) {
    return;
  }

  if (pixelScriptPromise !== null) {
    return pixelScriptPromise;
  }

  pixelScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = META_PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = META_PIXEL_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Meta Pixel script."));

    const head = document.head;
    if (head !== null) {
      head.appendChild(script);
      return;
    }

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript !== undefined && firstScript.parentNode !== null) {
      firstScript.parentNode.insertBefore(script, firstScript);
      return;
    }

    reject(new Error("Could not append Meta Pixel script to the document."));
  });

  return pixelScriptPromise;
};

const toRecord = <TEventName extends MetaEventName>(
  params: MetaEventParams<TEventName>,
): Record<string, unknown> => params as unknown as Record<string, unknown>;

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
};

export const useMetaPixel = (): UseMetaPixelResult => {
  const consent = useAnalyticsStore((state) => state.consent);
  const [isReady, setIsReady] = useState<boolean>(false);

  const isEnabled = useMemo<boolean>(() => {
    if (consent.status !== "granted") {
      return false;
    }

    return !consent.ccpa_opt_out;
  }, [consent.ccpa_opt_out, consent.status]);

  const pixelId = useMemo<string | null>(() => resolvePixelId(), []);
  const webhookUrl = useMemo<string | null>(() => resolveWebhookUrl(), []);

  useEffect(() => {
    if (!isEnabled || pixelId === null) {
      setIsReady(false);
      return;
    }

    let cancelled = false;

    void injectMetaPixelScript(pixelId)
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isEnabled, pixelId]);

  const track = useCallback(
    async <TEventName extends MetaEventName>(
      eventName: TEventName,
      params: MetaEventParams<TEventName>,
    ): Promise<MetaTrackResult> => {
      const eventID = createEventID();
      const eventTime = Math.floor(Date.now() / 1000);
      const method: "track" | "trackCustom" = isMetaStandardEventName(eventName)
        ? "track"
        : "trackCustom";
      const browserMethod = method as MetaBrowserPayload<TEventName>["method"];

      const store = useAnalyticsStore.getState();
      const canTrack = store.hasConsentForTracking();
      if (!canTrack) {
        return {
          eventID,
          browserSent: false,
          serverSent: false,
          serverStatus: null,
          skipped: true,
          reason: "consent_not_granted",
        };
      }

      const cookies = store.syncMetaCookies();
      const eventSourceUrl = isBrowserEnvironment() ? window.location.href : "";

      let browserSent = false;
      if (pixelId !== null && isBrowserEnvironment()) {
        try {
          await injectMetaPixelScript(pixelId);
          const fbq = window.fbq;

          if (typeof fbq === "function") {
            fbq(method, eventName, toRecord(params), { eventID });
            browserSent = true;
          }
        } catch {
          browserSent = false;
        }
      }

      if (webhookUrl === null) {
        return {
          eventID,
          browserSent,
          serverSent: false,
          serverStatus: null,
          skipped: false,
          reason: "missing_webhook_url",
        };
      }

      const browserPayload: MetaBrowserPayload<TEventName> = {
        provider: "meta",
        channel: "browser",
        method: browserMethod,
        event_name: eventName,
        event_id: eventID,
        event_time: eventTime,
        event_source_url: eventSourceUrl,
        action_source: "website",
        params,
      };

      const serverPayload: MetaServerPayload<TEventName> = {
        provider: "meta",
        channel: "server",
        event_name: eventName,
        event_id: eventID,
        event_time: eventTime,
        event_source_url: eventSourceUrl,
        action_source: "website",
        user_data: {
          external_id: store.anonymousId,
          fbp: cookies._fbp ?? undefined,
          fbc: cookies._fbc ?? undefined,
          client_user_agent: isBrowserEnvironment()
            ? window.navigator.userAgent
            : undefined,
        },
        custom_data: params,
      };

      const relayPayload: MetaRelayPayload<TEventName> = {
        provider: "meta",
        event_name: eventName,
        event_id: eventID,
        event_time: eventTime,
        browser: browserPayload,
        server: serverPayload,
        attribution: store.attribution,
        consent: store.consent,
        anonymous_id: store.anonymousId,
        cookies,
      };

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(relayPayload),
          credentials: "same-origin",
          keepalive: true,
        });

        return {
          eventID,
          browserSent,
          serverSent: response.ok,
          serverStatus: response.status,
          skipped: false,
          reason: response.ok ? null : `http_${response.status}`,
        };
      } catch (error) {
        return {
          eventID,
          browserSent,
          serverSent: false,
          serverStatus: null,
          skipped: false,
          reason: `network_error:${extractErrorMessage(error)}`,
        };
      }
    },
    [pixelId, webhookUrl],
  );

  return {
    isEnabled,
    isReady,
    pixelId,
    webhookUrl,
    track,
  };
};
