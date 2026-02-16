import { create } from 'zustand';
import type { PlayerState } from './types';

export const usePlayerStore = create<PlayerState>((set) => ({
  isReady: false,
  isPlaying: false,
  isMuted: false,
  currentTime: 0,
  inMutedPreview: false,
  showLazyCover: false,
  showCta: false,
  isSticky: false,
  // ¡AQUÍ ESTÁ LA SOLUCIÓN!: Tipado explícito de 'val'
  setIsReady: (val: boolean) => set({ isReady: val }),
  setIsPlaying: (val: boolean) => set({ isPlaying: val }),
  setIsMuted: (val: boolean) => set({ isMuted: val }),
  setCurrentTime: (val: number) => set({ currentTime: val }),
  setInMutedPreview: (val: boolean) => set({ inMutedPreview: val }),
  setShowLazyCover: (val: boolean) => set({ showLazyCover: val }),
  setShowCta: (val: boolean) => set({ showCta: val }),
  setIsSticky: (val: boolean) => set({ isSticky: val }),
}));