import { useCallback, useEffect, useRef, useState } from 'react';
import 'plyr/dist/plyr.css';
import { Play } from 'lucide-react';
import { CallToActionOverlay } from './components/CallToActionOverlay';
import { MutedOverlay } from './components/MutedOverlay';
import { PlayerControls } from './components/PlayerControls';
import { SmartPoster } from './components/SmartPoster';
import { useVideoProviderController } from './providers/useVideoProviderController';
import type { IVideoProvider } from './providers/IVideoProvider';
import type { KurukinPlayerProps } from './types';

function formatClassName(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export function KurukinPlayer({
  provider,
  videoId,
  mutedPreview = { enabled: false, overlayPosition: 'center' },
  lazyLoadYoutube,
  callToAction,
  hideYoutubeUi,
  smartPoster,
  className,
}: KurukinPlayerProps) {
  const isMutedPreviewEnabled = Boolean(mutedPreview.enabled);
  const isYoutubeLazyMode = provider === 'youtube' && Boolean(lazyLoadYoutube) && !isMutedPreviewEnabled;
  const shouldApplyYoutubeUiHack = provider === 'youtube' && Boolean(hideYoutubeUi);
  const isProviderImplemented = provider === 'youtube' || provider === 'bunnynet' || provider === 'html5';

  const [shouldLoadPlayer, setShouldLoadPlayer] = useState(!isYoutubeLazyMode);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(isMutedPreviewEnabled);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [inMutedPreview, setInMutedPreview] = useState(isMutedPreviewEnabled);
  const [showMutedPreviewOverlay, setShowMutedPreviewOverlay] = useState(isMutedPreviewEnabled);
  const [showPoster, setShowPoster] = useState(isYoutubeLazyMode);
  const [ctaTriggered, setCtaTriggered] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const pendingPlayIntentRef = useRef<'autoplay' | 'user' | null>(isMutedPreviewEnabled ? 'autoplay' : null);

  const handleProviderReady = useCallback((activeProvider: IVideoProvider) => {
    setIsReady(true);
    setIsMuted(activeProvider.isMuted());
    setDuration(activeProvider.getDuration());
  }, []);

  const handleProviderPlay = useCallback(() => {
    setIsPlaying(true);
    setShowPoster(false);
    setAutoplayBlocked(false);
  }, []);

  const handleProviderPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleProviderProgress = useCallback((seconds: number) => {
    setCurrentTime(seconds);
  }, []);

  const handleProviderEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleProviderMuteChange = useCallback((nextMuted: boolean) => {
    setIsMuted(nextMuted);
  }, []);

  const handleAutoplayBlocked = useCallback(() => {
    setAutoplayBlocked(true);
    setShowPoster(true);
    setShowMutedPreviewOverlay(false);
    setIsPlaying(false);
  }, []);

  const controller = useVideoProviderController({
    provider,
    enabled: shouldLoadPlayer,
    videoId,
    muted: isMuted,
    loop: inMutedPreview,
    hideNativeUi: hideYoutubeUi,
    onReady: handleProviderReady,
    onPlay: handleProviderPlay,
    onPause: handleProviderPause,
    onProgress: handleProviderProgress,
    onEnded: handleProviderEnded,
    onMuteChange: handleProviderMuteChange,
    onAutoplayBlocked: handleAutoplayBlocked,
  });

  const runPendingPlay = useCallback(async (activeProvider: IVideoProvider) => {
    const intent = pendingPlayIntentRef.current;

    if (!intent) {
      return;
    }

    pendingPlayIntentRef.current = null;

    try {
      await activeProvider.play();
      setShowPoster(false);
      setAutoplayBlocked(false);
    } catch (error) {
      activeProvider.pause();
      setShowPoster(true);
      setShowMutedPreviewOverlay(false);

      if (intent === 'autoplay') {
        setAutoplayBlocked(true);
      }
    }
  }, []);

  useEffect(() => {
    const lazyMode = provider === 'youtube' && Boolean(lazyLoadYoutube) && !mutedPreview.enabled;

    setShouldLoadPlayer(!lazyMode);
    setIsReady(false);
    setIsPlaying(false);
    setIsMuted(Boolean(mutedPreview.enabled));
    setCurrentTime(0);
    setDuration(0);
    setInMutedPreview(Boolean(mutedPreview.enabled));
    setShowMutedPreviewOverlay(Boolean(mutedPreview.enabled));
    setShowPoster(lazyMode);
    setAutoplayBlocked(false);
    setCtaTriggered(false);
    setShowCta(false);
    pendingPlayIntentRef.current = mutedPreview.enabled ? 'autoplay' : null;
  }, [provider, videoId, lazyLoadYoutube, mutedPreview.enabled]);

  useEffect(() => {
    if (!shouldLoadPlayer || !isReady || !controller.providerRef.current) {
      return;
    }

    void runPendingPlay(controller.providerRef.current);
  }, [controller.providerRef, isReady, runPendingPlay, shouldLoadPlayer]);

  useEffect(() => {
    if (!isReady || duration > 0) {
      return;
    }

    const nextDuration = controller.providerRef.current?.getDuration() ?? 0;

    if (nextDuration > 0) {
      setDuration(nextDuration);
    }
  }, [controller.providerRef, currentTime, duration, isReady]);

  useEffect(() => {
    if (!callToAction?.enabled || ctaTriggered || showCta || showMutedPreviewOverlay) {
      return;
    }

    if (currentTime >= callToAction.displayAtSeconds) {
      setCtaTriggered(true);
      setShowCta(true);
      controller.providerRef.current?.pause();
    }
  }, [callToAction, controller.providerRef, ctaTriggered, currentTime, showCta, showMutedPreviewOverlay]);

  const requestPlay = useCallback(
    async (intent: 'autoplay' | 'user', options?: { unmute: boolean }) => {
      pendingPlayIntentRef.current = intent;

      if (options?.unmute) {
        setIsMuted(false);
        setInMutedPreview(false);
        setShowMutedPreviewOverlay(false);
        controller.providerRef.current?.mute(false);
        controller.providerRef.current?.setLoop(false);
      }

      if (!shouldLoadPlayer) {
        setShouldLoadPlayer(true);
        return;
      }

      if (!controller.providerRef.current) {
        return;
      }

      await runPendingPlay(controller.providerRef.current);
    },
    [controller.providerRef, runPendingPlay, shouldLoadPlayer],
  );

  const handlePosterPlay = useCallback(() => {
    const shouldUnmuteOnManualStart = autoplayBlocked || !isMutedPreviewEnabled;
    void requestPlay('user', { unmute: shouldUnmuteOnManualStart });
  }, [autoplayBlocked, isMutedPreviewEnabled, requestPlay]);

  const handleDismissCta = useCallback(() => {
    setShowCta(false);
    void requestPlay('user');
  }, [requestPlay]);

  const handleExitMutedPreview = useCallback(() => {
    controller.providerRef.current?.seek(0);
    setCurrentTime(0);
    void requestPlay('user', { unmute: true });
  }, [controller.providerRef, requestPlay]);

  const handleResumeFromPauseOverlay = useCallback(() => {
    void requestPlay('user');
  }, [requestPlay]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      controller.providerRef.current?.pause();
      return;
    }

    void requestPlay('user');
  }, [controller.providerRef, isPlaying, requestPlay]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;

    setIsMuted(nextMuted);
    controller.providerRef.current?.mute(nextMuted);

    if (!nextMuted) {
      setInMutedPreview(false);
      setShowMutedPreviewOverlay(false);
      controller.providerRef.current?.setLoop(false);
    }
  }, [controller.providerRef, isMuted]);

  const handleSeek = useCallback(
    (seconds: number) => {
      setCurrentTime(seconds);
      controller.providerRef.current?.seek(seconds);
    },
    [controller.providerRef],
  );

  const handleRestart = useCallback(() => {
    handleSeek(0);
    void requestPlay('user');
  }, [handleSeek, requestPlay]);

  const posterTitle = autoplayBlocked
    ? smartPoster?.title || 'El navegador bloqueó el autoplay'
    : smartPoster?.title || 'Video listo para reproducir';

  const posterDescription = autoplayBlocked
    ? smartPoster?.description || 'Haz click para iniciar la reproducción manualmente.'
    : smartPoster?.description || 'Pulsa play para ver el video con nuestra experiencia premium.';

  const shouldShowPauseOverlay = !isPlaying && isReady && !inMutedPreview && !showCta && !showPoster;
  const shouldShowControls = shouldLoadPlayer && isReady && !showPoster && !showCta && !showMutedPreviewOverlay;

  return (
    <div
      className={formatClassName(
        'relative h-full w-full overflow-hidden rounded-2xl bg-black',
        shouldApplyYoutubeUiHack && '[&_iframe]:scale-[1.45] [&_iframe]:origin-center',
        className,
      )}
    >
      {shouldLoadPlayer ? (
        <div className="h-full w-full">
          {controller.surface === 'video' ? (
            <video ref={controller.mountRef} className="h-full w-full object-cover" playsInline controls={false} />
          ) : (
            <div ref={controller.mountRef} className="h-full w-full" />
          )}
        </div>
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_35%),linear-gradient(135deg,#0a0a0b,#111827)]" />
      )}

      <SmartPoster
        visible={showPoster}
        imageUrl={smartPoster?.imageUrl}
        eyebrow={
          autoplayBlocked
            ? smartPoster?.eyebrow || 'Autoplay bloqueado'
            : smartPoster?.eyebrow || (isYoutubeLazyMode ? 'Smart Poster' : 'Universal Video Engine')
        }
        title={posterTitle}
        description={posterDescription}
        buttonText={smartPoster?.buttonText || 'Reproducir video'}
        onPlay={handlePosterPlay}
      />

      {shouldLoadPlayer && isMutedPreviewEnabled && showMutedPreviewOverlay ? (
        <MutedOverlay config={mutedPreview} onActivateSound={handleExitMutedPreview} />
      ) : null}

      {shouldShowPauseOverlay ? (
        <div
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/50 backdrop-blur-md"
          onClick={handleResumeFromPauseOverlay}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleResumeFromPauseOverlay();
            }
          }}
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur">
            <Play className="h-10 w-10 fill-white text-white" />
          </span>
        </div>
      ) : null}

      {shouldShowControls ? (
        <PlayerControls
          currentTime={currentTime}
          duration={duration}
          isMuted={isMuted}
          isPlaying={isPlaying}
          onRestart={handleRestart}
          onSeek={handleSeek}
          onToggleMute={handleToggleMute}
          onTogglePlay={handleTogglePlay}
        />
      ) : null}

      {!isProviderImplemented ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6 text-center text-white">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Provider pendiente</p>
            <p className="mt-2 text-sm text-white/80">
              {provider} quedó preparado en la factory, pero su adapter aún no está implementado.
            </p>
          </div>
        </div>
      ) : null}

      {callToAction?.enabled && showCta ? (
        <CallToActionOverlay callToAction={callToAction} onDismiss={handleDismissCta} />
      ) : null}
    </div>
  );
}
