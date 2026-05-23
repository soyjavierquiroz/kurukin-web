import { ExternalLink, X } from 'lucide-react';
import type { CallToActionConfig } from '../types';

interface CallToActionOverlayProps {
  callToAction: CallToActionConfig;
  onDismiss: () => void;
}

export function CallToActionOverlay({ callToAction, onDismiss }: CallToActionOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950/95 p-6 text-center text-white shadow-2xl">
        {callToAction.isDismissible ? (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-3 top-3 rounded-full p-1.5 text-white/70 transition hover:bg-zinc-900 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}

        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">Oferta activa</p>
        <h3 className="mt-3 text-2xl font-bold leading-tight">{callToAction.headline}</h3>
        <a
          href={callToAction.buttonUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-6 py-3 text-base font-bold uppercase text-slate-950 transition hover:opacity-95"
        >
          {callToAction.buttonText}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
