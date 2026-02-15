export type OverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface MutedPreviewConfig {
  enabled: boolean;
  overlayImageUrl?: string;
  overlayPosition?: OverlayPosition;
  buttonText?: string;
  
  // Opciones de personalización del diseño ClickFunnels
  fallbackColor?: string; 
  fallbackText1?: string; 
  fallbackText2?: string; 
}

export interface CallToActionConfig {
  enabled: boolean;
  displayAtSeconds: number;
  headline: string;
  buttonText: string;
  buttonUrl: string;
  isDismissible?: boolean;
}

export interface KurukinPlayerProps {
  provider: 'youtube' | 'vimeo' | 'html5';
  videoId: string;
  mutedPreview?: MutedPreviewConfig;
  lazyLoadYoutube?: boolean;
  stickyScroll?: boolean;
  callToAction?: CallToActionConfig;
  hideYoutubeUi?: boolean;
}

export interface PlayerState {
  isReady: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  inMutedPreview: boolean;
  showLazyCover: boolean;
  showCta: boolean;
  isSticky: boolean;
}