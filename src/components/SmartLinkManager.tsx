import { FormEvent, useMemo, useState } from 'react';
import { useYourls } from '../hooks/useYourls';

type RecentLink = {
  keyword: string;
  longUrl: string;
  protectedUrl: string;
};

const extractKeyword = (payload: {
  keyword?: string;
  url?: { keyword?: string };
}): string | null => {
  const directKeyword = payload.keyword?.trim();
  if (directKeyword) {
    return directKeyword;
  }

  const nestedKeyword = payload.url?.keyword?.trim();
  if (nestedKeyword) {
    return nestedKeyword;
  }

  return null;
};

export function SmartLinkManager() {
  const [longUrl, setLongUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [recentLinks, setRecentLinks] = useState<RecentLink[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { createShortLink, isLoading, error } = useYourls();

  const activeError = useMemo(() => submitError ?? error, [submitError, error]);

  const handleCopy = async (url: string, slug: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      window.setTimeout(() => setCopiedSlug((current) => (current === slug ? null : current)), 1800);
    } catch {
      setSubmitError('No se pudo copiar el enlace al portapapeles.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      const destination = longUrl.trim();
      const optionalKeyword = customSlug.trim() || undefined;
      const response = await createShortLink(destination, optionalKeyword);
      const keyword = extractKeyword(response);

      if (!keyword) {
        throw new Error('YOURLS no devolvió un slug válido.');
      }

      const protectedUrl = `${window.location.origin}/l/${keyword}`;
      setRecentLinks((currentLinks) => [
        {
          keyword,
          longUrl: destination,
          protectedUrl,
        },
        ...currentLinks,
      ]);

      setCustomSlug('');
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Ocurrió un error al crear el enlace protegido.';
      setSubmitError(message);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-200 shadow-2xl shadow-black/30">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Smart Link Manager</h2>
        <p className="mt-2 text-sm text-slate-400">
          Crea enlaces protegidos con slug personalizado y adminístralos en la sesión actual.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">URL de Destino</span>
          <input
            type="url"
            required
            value={longUrl}
            onChange={(event) => setLongUrl(event.target.value)}
            placeholder="https://ejemplo.com/oferta"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Slug Personalizado (opcional)</span>
          <input
            type="text"
            value={customSlug}
            onChange={(event) => setCustomSlug(event.target.value)}
            placeholder="mi-campana"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Acortando...' : 'Acortar y Proteger'}
        </button>
      </form>

      {activeError ? (
        <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{activeError}</p>
      ) : null}

      <div className="mt-8">
        <h3 className="mb-3 text-lg font-semibold text-slate-100">Enlaces Recientes</h3>
        {recentLinks.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-6 text-center text-sm text-slate-400">
            Aún no hay enlaces creados en esta sesión.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/70 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">URL Original</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                {recentLinks.map((link) => (
                  <tr key={link.protectedUrl}>
                    <td className="px-4 py-3 font-mono text-cyan-300">/l/{link.keyword}</td>
                    <td className="max-w-md truncate px-4 py-3 text-slate-300" title={link.longUrl}>
                      {link.longUrl}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void handleCopy(link.protectedUrl, link.keyword)}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                      >
                        {copiedSlug === link.keyword ? 'Copiado' : 'Copiar enlace'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
