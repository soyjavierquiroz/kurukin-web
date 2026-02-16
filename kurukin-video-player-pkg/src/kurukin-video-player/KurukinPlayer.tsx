import { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { ExternalLink, Play, Volume2, X } from 'lucide-react';
import { usePlayerStore } from './store';
// SOLUCIÓN TS: Añadimos la palabra "type"
import type { KurukinPlayerProps, OverlayPosition } from './types'; 

const POSITION_CLASSES: Record<OverlayPosition, string> = {
  center: 'items-center justify-center',
  'top-left': 'items-start justify-start p-6',
  'top-right': 'items-start justify-end p-6',
  'bottom-left': 'items-end justify-start p-6',
  'bottom-right': 'items-end justify-end p-6',
};

export function KurukinPlayer({
  provider,
  videoId,
  mutedPreview = { enabled: false, overlayPosition: 'center' },
  lazyLoadYoutube,
  callToAction,
  hideYoutubeUi,
}: KurukinPlayerProps) {
  const mediaRef = useRef<HTMLElement | null>(null);
  const playerRef = useRef<Plyr | null>(null);

  const isMutedPreviewEnabled = Boolean(mutedPreview.enabled);
  const isYoutubeLazyMode = provider === 'youtube' && Boolean(lazyLoadYoutube) && !isMutedPreviewEnabled;
  const shouldApplyYoutubeUiHack = provider === 'youtube' && Boolean(hideYoutubeUi);
  const overlayPosition = mutedPreview.overlayPosition || 'center';

  const [shouldLoadPlayer, setShouldLoadPlayer] = useState(!isYoutubeLazyMode);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [showMutedPreviewOverlay, setShowMutedPreviewOverlay] = useState(isMutedPreviewEnabled);
  const [ctaTriggered, setCtaTriggered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    isReady,
    isPlaying,
    inMutedPreview,
    showLazyCover: shouldShowLazyCover,
    currentTime,
    showCta,
    setIsReady,
    setIsPlaying,
    setIsMuted,
    setCurrentTime,
    setInMutedPreview,
    setShowLazyCover,
    setShowCta,
  } = usePlayerStore();

  useEffect(() => {
    const lazyMode = provider === 'youtube' && Boolean(lazyLoadYoutube) && !mutedPreview.enabled;

    setShouldLoadPlayer(!lazyMode);
    setShouldAutoplay(false);
    setShowMutedPreviewOverlay(Boolean(mutedPreview.enabled));
    setCtaTriggered(false);

    setShowLazyCover(lazyMode);
    setInMutedPreview(Boolean(mutedPreview.enabled));
    setShowCta(false);
    setCurrentTime(0);
    setIsReady(false);
    setIsPlaying(false);
    setIsMuted(Boolean(mutedPreview.enabled));
  }, [
    provider,
    videoId,
    lazyLoadYoutube,
    mutedPreview.enabled,
    setCurrentTime,
    setInMutedPreview,
    setIsMuted,
    setIsPlaying,
    setIsReady,
    setShowCta,
    setShowLazyCover,
  ]);

  useEffect(() => {
    setImageError(false);
  }, [mutedPreview.overlayImageUrl]);

  useEffect(() => {
    if (!shouldLoadPlayer || !mediaRef.current) {
      return;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const options: Plyr.Options = {
      autoplay: shouldAutoplay || isMutedPreviewEnabled,
      muted: isMutedPreviewEnabled,
      clickToPlay: true,
      loop: {
        active: isMutedPreviewEnabled,
      },
      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        playsinline: 1,
        modestbranding: hideYoutubeUi ? 1 : 0,
        iv_load_policy: hideYoutubeUi ? 3 : 1,
      },
    };

    const player = new Plyr(mediaRef.current, options);
    playerRef.current = player;

    player.on('ready', () => {
      setIsReady(true);
      setIsMuted(player.muted);

      if (isMutedPreviewEnabled) {
        player.muted = true;
        void Promise.resolve(player.play()).catch(() => undefined);
      }

      if (shouldAutoplay) {
        void Promise.resolve(player.play()).catch(() => undefined);
      }
    });

    player.on('playing', () => {
      setIsPlaying(true);
    });

    player.on('pause', () => {
      setIsPlaying(false);
    });

    player.on('timeupdate', () => {
      setCurrentTime(player.currentTime);
    });

    player.on('ended', () => {
      player.currentTime = 0;
      player.pause();
    });

    player.on('volumechange', () => {
      setIsMuted(player.muted);
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [
    hideYoutubeUi,
    isMutedPreviewEnabled,
    setCurrentTime,
    setIsMuted,
    setIsPlaying,
    setIsReady,
    shouldAutoplay,
    shouldLoadPlayer,
  ]);

  useEffect(() => {
    if (!callToAction?.enabled || ctaTriggered || showCta || showMutedPreviewOverlay) {
      return;
    }

    if (currentTime >= callToAction.displayAtSeconds) {
      setCtaTriggered(true);
      setShowCta(true);
      playerRef.current?.pause();
    }
  }, [callToAction, ctaTriggered, currentTime, setShowCta, showCta, showMutedPreviewOverlay]);

  const handleLoadYoutube = () => {
    setShouldLoadPlayer(true);
    setShouldAutoplay(true);
    setShowLazyCover(false);
  };

  const handleExitMutedPreview = () => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    player.currentTime = 0;
    player.muted = false;
    player.loop = false;

    setShowMutedPreviewOverlay(false);
    setInMutedPreview(false);
    setIsMuted(false);

    void Promise.resolve(player.play()).catch(() => undefined);
  };

  const handleDismissCta = () => {
    setShowCta(false);
    void Promise.resolve(playerRef.current?.play()).catch(() => undefined);
  };

  const handleResumeFromPauseOverlay = () => {
    void Promise.resolve(playerRef.current?.play()).catch(() => undefined);
  };

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-black ${
        shouldApplyYoutubeUiHack ? '[&_iframe]:scale-[1.45] [&_iframe]:origin-center' : ''
      }`}
    >
      {isYoutubeLazyMode && !shouldLoadPlayer ? (
        <button
          type="button"
          onClick={handleLoadYoutube}
          className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 transition hover:from-zinc-800 hover:to-zinc-700"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_65%)]" />
          <div className="relative z-10 flex flex-col items-center gap-3 text-white">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30 backdrop-blur">
              <Play className="h-10 w-10 fill-white" />
            </span>
            <span className="text-base font-semibold tracking-wide">Cargar video</span>
          </div>
        </button>
      ) : (
        <div className="h-full w-full">
          {provider === 'html5' ? (
            <video
              ref={(node) => {
                mediaRef.current = node;
              }}
              className="h-full w-full"
              controls
              playsInline
            >
              <source src={videoId} />
            </video>
          ) : (
            <div
              ref={(node) => {
                mediaRef.current = node;
              }}
              data-plyr-provider={provider}
              data-plyr-embed-id={videoId}
            />
          )}
        </div>
      )}

      {shouldLoadPlayer && isMutedPreviewEnabled && showMutedPreviewOverlay && (
        <button
          type="button"
          onClick={handleExitMutedPreview}
          className={`absolute inset-0 z-20 flex bg-black/30 ${POSITION_CLASSES[overlayPosition]}`}
        >
          {mutedPreview.overlayImageUrl && !imageError ? (
            <img
              src={mutedPreview.overlayImageUrl}
              alt="Activar sonido"
              className="h-auto w-auto max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            // NUESTRO DISEÑO CLICKFUNNELS PARAMETRIZABLE
            <div className="flex items-center gap-3 bg-black/40 p-2 md:p-3 rounded-xl backdrop-blur-md border border-white/10 drop-shadow-2xl">
                <div 
                  className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full animate-pulse"
                  style={{ 
                    backgroundColor: mutedPreview.fallbackColor || '#f39c12', 
                    boxShadow: `0 0 15px ${mutedPreview.fallbackColor || '#f39c12'}80` 
                  }}
                >
                    <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" />
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-white font-extrabold text-sm md:text-base leading-none drop-shadow-md tracking-wide">
                        {mutedPreview.fallbackText1 || 'CLICK PARA'}
                    </span>
                    <span className="text-white font-extrabold text-sm md:text-base leading-none mt-1 drop-shadow-md tracking-wide">
                        {mutedPreview.fallbackText2 || 'ACTIVAR SONIDO'}
                    </span>
                </div>
            </div>
          )}
        </button>
      )}

      {!isPlaying && isReady && !inMutedPreview && !showCta && !shouldShowLazyCover && (
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
      )}

      {callToAction?.enabled && showCta && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950/95 p-6 text-center text-white shadow-2xl">
            {callToAction.isDismissible && (
              <button
                type="button"
                onClick={handleDismissCta}
                className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <h3 className="text-2xl font-bold leading-tight">{callToAction.headline}</h3>
            <a
              href={callToAction.buttonUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-black transition hover:bg-emerald-400"
            >
              {callToAction.buttonText}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}