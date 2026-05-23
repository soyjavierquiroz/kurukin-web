import { BadgeCheck, Lock, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useVisitor } from '../context/VisitorContext';

export type PricingScrapedData = Record<string, { total: string; tax?: string }>;

export interface PricingCardProps {
  productName: string;
  basePriceUSD: number;
  checkoutUrl: string;
  scrapedData?: PricingScrapedData;
}

export function PricingCard({ productName, basePriceUSD, checkoutUrl, scrapedData }: PricingCardProps) {
  const { visitorData } = useVisitor();

  const countryCode = visitorData?.country_code?.toUpperCase() ?? 'US';
  const currencyCode = visitorData?.currency?.toUpperCase() ?? 'USD';

  const countryPricing = useMemo(() => {
    if (!scrapedData) return undefined;
    return scrapedData[countryCode];
  }, [countryCode, scrapedData]);

  const hasScrapedPrice = Boolean(countryPricing?.total);
  const isArgentinaCase = countryCode === 'AR' && hasScrapedPrice;
  const isStandardScrapedCase = countryCode !== 'AR' && countryCode !== 'US' && hasScrapedPrice;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur md:p-8">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400">Oferta Especial</p>
        <h3 className="mt-2 text-2xl font-extrabold text-white md:text-3xl">Activa {productName} hoy mismo</h3>
        <p className="mt-2 text-sm text-slate-300">Valor base: {basePriceUSD} USD</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        {isArgentinaCase ? (
          <div className="space-y-3 text-slate-100">
            <p className="text-base md:text-lg">
              <span className="text-slate-300">Precio:</span> {basePriceUSD} USD
            </p>
            <p className="text-base md:text-lg">
              <span className="text-slate-300">Impuestos locales (PAIS, Ganancias, etc.):</span>{' '}
              {countryPricing?.tax ? `${countryPricing.tax} ${currencyCode}` : `Incluidos ${currencyCode}`}
            </p>
            <p className="text-lg font-bold text-amber-400 md:text-xl">
              Total final en Hotmart: {countryPricing?.total} {currencyCode}
            </p>
          </div>
        ) : null}

        {isStandardScrapedCase ? (
          <div className="space-y-2 text-center">
            <p className="text-3xl font-extrabold text-amber-400 md:text-4xl">
              {countryPricing?.total} {currencyCode}
            </p>
            <p className="text-xs text-slate-300 md:text-sm">(Equivalente a {basePriceUSD} USD. Impuestos incluidos)</p>
          </div>
        ) : null}

        {!isArgentinaCase && !isStandardScrapedCase ? (
          <div className="text-center">
            <p className="text-3xl font-extrabold text-amber-400 md:text-4xl">{basePriceUSD} USD</p>
            <p className="mt-2 text-xs text-slate-300 md:text-sm">Precio internacional directo.</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-6 text-base font-bold uppercase text-slate-950 transition hover:opacity-95 md:h-14 md:text-lg"
        >
          Comprar Ahora
        </a>

        <div className="mt-4 grid gap-2 text-xs text-slate-300 md:grid-cols-3 md:text-sm">
          <p className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            Pago seguro
          </p>
          <p className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
            <Lock className="h-4 w-4 text-amber-400" />
            Procesado por Hotmart
          </p>
          <p className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
            <BadgeCheck className="h-4 w-4 text-amber-400" />
            Acceso inmediato
          </p>
        </div>
      </div>
    </section>
  );
}

export default PricingCard;
