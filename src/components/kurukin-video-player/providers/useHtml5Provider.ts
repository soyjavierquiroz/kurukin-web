import { useEffect, useRef } from 'react';
import { createProviderEventHub } from './createProviderEventHub';
import { bindNativeVideoEvents, createNativeVideoProvider } from './nativeVideoProvider';
import { subscribeProviderCallbacks } from './subscribeProviderCallbacks';
import type { ProviderBinding, ProviderHookOptions } from './IVideoProvider';

export function useHtml5Provider({
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
    videoElement.src = videoId;

    const cleanupEvents = bindNativeVideoEvents(videoElement, eventHub, notifyReady);

    return () => {
      cleanupEvents();
      unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
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
