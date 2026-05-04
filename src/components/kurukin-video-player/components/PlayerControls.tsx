import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PlayerControlsProps {
  currentTime: number;
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
  onRestart: () => void;
  onSeek: (seconds: number) => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const safeSeconds = Math.floor(seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function PlayerControls({
  currentTime,
  duration,
  isMuted,
  isPlaying,
  onRestart,
  onSeek,
  onToggleMute,
  onTogglePlay,
}: PlayerControlsProps) {
  const safeDuration = duration > 0 ? duration : Math.max(currentTime, 1);

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-4 pb-4 pt-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
        <input
          type="range"
          min={0}
          max={safeDuration}
          step={0.1}
          value={Math.min(currentTime, safeDuration)}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer accent-emerald-400"
          aria-label="Buscar en el video"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2 text-white">
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/15"
            aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/15"
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar video'}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/15"
            aria-label="Reiniciar video"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="ml-auto text-sm font-medium text-white/80">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
