import Hls from 'hls.js';
import { useEffect, useRef } from 'react';
import { createProviderEventHub } from './createProviderEventHub';
import { bindNativeVideoEvents, createNativeVideoProvider } from './nativeVideoProvider';
import { subscribeProviderCallbacks } from './subscribeProviderCallbacks';
import type { ProviderBinding, ProviderHookOptions } from './IVideoProvider';

export function useBunnyProvider({
  enabled,
  videoId,
  muted,
  loop,
  onReady,
  onPlay,
  onPause,
  onProgress,
  onEnded,
  onMuteChange,
  onAutoplayBlocked,
}: ProviderHookOptions): ProviderBinding<HTMLVideoElement> {
  const mountRef = useRef<HTMLVideoElement | null>(null);
  const providerRef = useRef<ReturnType<typeof createNativeVideoProvider> | null>(null);

  useEffect(() => {
    if (!enabled || !mountRef.current) {
      return;
    }

    const videoElement = mountRef.current;
    const eventHub = createProviderEventHub();
    const provider = createNativeVideoProvider(videoElement, eventHub);
    const unsubscribeCallbacks = subscribeProviderCallbacks(provider, {
      onReady,
      onPlay,
      onPause,
      onProgress,
      onEnded,
      onMuteChange,
      onAutoplayBlocked,
    });
    let hls: Hls | null = null;
    let readyEmitted = false;

    const notifyReady = () => {
      if (readyEmitted) {
        return;
      }

      readyEmitted = true;
      eventHub.emit('ready', provider);
    };

    providerRef.current = provider;
    videoElement.playsInline = true;
    videoElement.preload = 'metadata';
    videoElement.muted = muted;
    videoElement.loop = loop;

    const cleanupEvents = bindNativeVideoEvents(videoElement, eventHub, notifyReady);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
      });

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(videoId);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        notifyReady();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('[KurukinPlayer] Bunny HLS fatal error', data);
        }
      });

      hls.attachMedia(videoElement);
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = videoId;
    } else {
      console.warn('[KurukinPlayer] HLS no es compatible en este navegador para Bunny.net.');
    }

    return () => {
      cleanupEvents();
      unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
      hls?.destroy();
      provider.destroy();
      providerRef.current = null;
    };
  }, [enabled, loop, muted, onAutoplayBlocked, onEnded, onMuteChange, onPause, onPlay, onProgress, onReady, videoId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    providerRef.current?.mute(muted);
  }, [enabled, muted]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    providerRef.current?.setLoop(loop);
  }, [enabled, loop]);

  return {
    mountRef,
    providerRef,
  };
}
