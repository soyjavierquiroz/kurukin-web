import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, XCircle } from 'lucide-react';
import { KurukinPlayer } from 'kurukin-video-player';
import LeadflowApplicationForm from '../components/LeadflowApplicationForm';

const LEADFLOW_VIDEO_URL = 'MxZAaLQZWLo';

const ctaBaseClassName = [
  'group inline-flex w-full min-h-[64px] items-center justify-center gap-3 rounded-2xl',
  'bg-blue-600 px-8 py-4 text-center text-lg font-bold text-white',
  'shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-pulse transition-all hover:scale-105',
  'sm:w-auto sm:bg-gradient-to-r sm:from-cyan-500 sm:to-blue-600',
].join(' ');

const problemBullets = [
  'Si dejas de trabajar, el equipo se detiene',
  'Los nuevos no duplican lo que haces',
  'Tu equipo no sabe cerrar sin ti',
  'No hay duplicación real',
];

const socialProofCards = [
  {
    metric: '327',
    detail: 'prospectos en 30 días',
  },
  {
    metric: '10',
    detail: 'miembros activos en 14 días',
  },
  {
    metric: '80%',
    detail: 'menos tiempo hasta la primera firma',
  },
];

const filterBullets = [
  '✔ Tienes un equipo de al menos 10 miembros activos y dispuestos',
  '✔ Junto a tu equipo pueden invertir al menos $ 1,000 USD en publicidad',
  '✔ Tu oferta y negocio es real y ya convierte',
];

// ARRAY DE LOGOS MLM
const mlmLogos = [
  'https://cdn.kuruk.in/leadflow-assets/landing/logos-mlm/1.webp',
  'https://cdn.kuruk.in/leadflow-assets/landing/logos-mlm/2.webp',
  'https://cdn.kuruk.in/leadflow-assets/landing/logos-mlm/3.webp',
  'https://cdn.kuruk.in/leadflow-assets/landing/logos-mlm/4.webp',
  'https://cdn.kuruk.in/leadflow-assets/landing/logos-mlm/5.webp',
  'https://cdn.kuruk.in/leadflow-assets/landing/logos-mlm/6.webp',
  'https://cdn.kuruk.in/leadflow-assets/landing/logos-mlm/7.webp',
  'https://cdn.kuruk.in/leadflow-assets/landing/logos-mlm/8.webp',
];

function LeadflowCta({
  text,
  microCopy,
  className = '',
  onClick,
}: {
  text: string;
  microCopy?: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <div className={`flex flex-col items-center sm:items-start ${className}`}>
      <button type="button" onClick={onClick} className={ctaBaseClassName}>
        <span>{text}</span>
        <ArrowRight className="h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1" />
      </button>
      {microCopy ? (
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-400 sm:text-left max-w-sm">
          {microCopy}
        </p>
      ) : null}
    </div>
  );
}

export default function LeadflowPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (isFormOpen) {
      const videos = document.querySelectorAll('video');
      videos.forEach((video) => {
        if (!video.paused) {
          video.pause();
        }
      });
    }
  }, [isFormOpen]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 text-center text-xs font-medium text-white sm:px-6 sm:text-sm">
          🔒 Solo para líderes con equipos activos. Solo aceptamos 5 equipos nuevos este mes.
        </div>
      </div>

      <main>
        {/* HERO SECTION */}
        <section id="hero" className="relative overflow-hidden bg-black">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_22%)]" />

  {/* Ajuste en lg:grid-cols para dar más espacio al copy (1.2fr vs 0.8fr) */}
  <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-14">
    
    {/* Columna del Copy: eliminamos el max-w-3xl para que aproveche el nuevo espacio */}
    <div className="max-w-none">
      <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">
        ATENCIÓN LÍDERES SERIOS DE MULTINIVEL
      </p>

      <h1 className="mt-5 text-4xl font-bold leading-[1.02] text-white md:text-6xl">
        Si tu equipo no genera conversaciones diarias sin ti... <span className="text-cyan-300">tienes un empleo disfrazado.</span>
      </h1>

      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
        Genera entre 3 a 10 conversaciones diarias por miembro en 7 días — sin crear contenido, sin perseguir prospectos y sin depender de algoritmos.
      </p>

      <div className="mt-8">
        <LeadflowCta
          text="Quiero ver si califico para obtener LEDFLOW"
          microCopy="Toma menos de 1 minuto. Solo trabajamos con equipos listos para escalar."
          onClick={() => setIsFormOpen(true)}
        />
      </div>

      <p className="mt-5 text-center text-base font-medium text-slate-300 sm:text-left">
        Hemos ayudado a varios equipos MLM hispanos a generar prospectos y crecer sus negocios de manera consistente y predecible.
      </p>
    </div>

    {/* Columna del Video: Formato 3:4 */}
    <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
      <div className="absolute -inset-6 bg-white/5 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050505] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
        
        {/* Cambio a aspect-[3/4] */}
        <div className="aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-black">
  <KurukinPlayer
    provider="youtube"
    videoId={LEADFLOW_VIDEO_URL}
    mutedPreview={{
      enabled: true,
      overlayPosition: 'center',
      buttonText: 'Escuchar ahora',
      fallbackText1: 'MENSAJE URGENTE',
      fallbackText2: 'ACTIVA EL AUDIO',
    }}
    smartPoster={{
      eyebrow: 'Mensaje Urgente',
      title: 'Haz clic para ver por qué tu equipo no crece',
      description: 'Haz clic y escucha el punto exacto que esta frenando la duplicación.',
      buttonText: 'Ver mensaje',
    }}
    className="rounded-[1.5rem] [&_video]:origin-center [&_video]:scale-[1.02] [&_video]:transform-gpu"
  />
</div>
      </div>
    </div>
  </div>
</section>

        {/* FRANJA DE VALIDACIÓN (LOGOS MLM) */}
        <section className="border-y border-white/5 bg-black py-10 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Equipos en estas compañías ya usan este sistema...
            </p>
          </div>

          <div className="relative mx-auto flex max-w-7xl overflow-hidden">
            <div className="absolute bottom-0 left-0 top-0 z-10 w-16 bg-gradient-to-r from-black to-transparent sm:w-32" />
            <div className="absolute bottom-0 right-0 top-0 z-10 w-16 bg-gradient-to-l from-black to-transparent sm:w-32" />

            <div className="flex w-max animate-[marquee_30s_linear_infinite] items-center hover:[animation-play-state:paused]">
              {[...mlmLogos, ...mlmLogos].map((logo, index) => (
                <div 
                  key={index} 
                  className="mx-6 flex w-24 flex-shrink-0 items-center justify-center transition-opacity duration-300 hover:opacity-100 sm:mx-10 sm:w-32 opacity-60 grayscale hover:grayscale-0"
                >
                  <img
                    src={logo}
                    alt={`Logo MLM ${index}`}
                    className="h-auto w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
          `}} />
        </section>

        {/* SECCIÓN DEPENDENCIA OPTIMIZADA */}
        <section className="bg-slate-50 text-slate-950 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold leading-[1.1] md:text-5xl">
                  Si hoy el equipo no se mueve sin ti, no tienes estructura. <span className="text-red-600">Tienes dependencia.</span>
                </h2>

                <p className="mt-8 text-lg font-bold text-slate-800">
                  👉 Esto es lo que realmente está pasando en tu equipo:
                </p>

                <div className="mt-5 space-y-4">
                  {problemBullets.map((item) => (
                    <div 
                      key={item} 
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-red-100 group"
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-500 transition-transform group-hover:scale-110" />
                      </div>
                      <p className="text-lg font-medium text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-red-100 to-cyan-100 blur-3xl opacity-60 rounded-full" />
                <img 
                  src="https://cdn.kuruk.in/leadflow-assets/landing/dependencia.webp" 
                  alt="Estructura vs Dependencia" 
                  className="relative rounded-[2.5rem] shadow-2xl border-8 border-white"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-black">
          <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 md:py-24">
            <h2 className="text-3xl font-bold leading-tight text-white md:text-5xl">
              El problema no es tu equipo. Es que no tienen sistema.
            </h2>
          </div>
        </section>

        {/* SECCIÓN "ASÍ ES COMO SE MUEVE SIN TI" */}
        <section className="relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_32%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <div className="max-w-4xl">
              <h2 className="text-3xl font-bold leading-tight text-white md:text-5xl">
                Así es como tu equipo empieza a moverse y <span className="text-cyan-300">crecer de forma predecible mes a mes</span>
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
                Funciona porque es simple: cuando tu equipo tiene conversaciones todos los días, el crecimiento deja de depender de unos pocos y se vuelve automático.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)] lg:items-center">
              <div className="ml-3 border-l-2 border-blue-500/30 pl-6 space-y-6">
                {[
                  ['01', 'Ayudamos a líderes MLM con +20 personas a generar 3–10 conversaciones diarias en 7 días', 'Sin perseguir, sin crear contenido diario.'],
                  ['02', 'El sistema los asigna automáticamente a tu equipo', 'Cada miembro recibe prospectos listos para iniciar conversación.'],
                  ['03', 'Tu equipo inicia conversaciones y da seguimiento a prospectos todos los días', 'Guiones simples + seguimiento automático = conversaciones diarias.'],
                ].map(([number, title, description]) => (
                  <div key={number} className="relative rounded-xl border border-white/5 bg-slate-900/50 p-5">
                    <div className="absolute -left-[34px] top-6 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.5)]" />
                    <div className="text-sm font-bold tracking-[0.28em] text-blue-300">{number}</div>
                    <h3 className="mt-3 text-2xl font-bold text-white">{title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-300 md:text-lg">{description}</p>
                  </div>
                ))}

                <div className="relative mt-8 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-5 backdrop-blur-sm">
                  <div className="absolute -left-[34px] top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.5)]" />
                  <p className="text-lg font-medium text-slate-100">
                    <span className="font-bold text-cyan-300">⚡ Resultado:</span> tu equipo tiene conversaciones nuevas todos los días y deja de depender de ti para crecer y moverse.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-cyan-600/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img 
                  src="https://cdn.kuruk.in/leadflow-assets/landing/sindependencia.webp" 
                  alt="Diagrama de flujo de equipo sin dependencia" 
                  className="relative rounded-[2rem] border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            </div>

            <div className="mt-12">
              <LeadflowCta
                text="Quiero que mi equipo genere prospectos ahora"
                onClick={() => setIsFormOpen(true)}
              />
            </div>
          </div>
        </section>

        <section className="bg-black">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-red-300">⚠️ Esto no es para todos</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white md:text-5xl">Leadflow es para líderes con equipo que están listos para escalar. Si estás empezando, esto no es para ti.</h2>
            <div className="mt-10 rounded-2xl border border-red-900/30 bg-red-950/20 p-6 divide-y divide-white/10 border-y border-white/10">
              {filterBullets.map((item) => (
                <div key={item} className="py-5 text-lg text-slate-200">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white text-slate-950">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl md:p-12">
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="h-16 w-16 text-blue-500" />
                <h2 className="mt-6 text-3xl font-bold md:text-5xl">Si en 30 días tu equipo no está teniendo conversaciones diarias con prospectos reales, seguimos trabajando contigo hasta lograrlo.</h2>
                <div className="mt-10">
                  <LeadflowCta text="Quiero aplicar para LEADFLOW" onClick={() => setIsFormOpen(true)} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {isFormOpen && (
          <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-md h-[100dvh] w-screen overflow-hidden flex flex-col">
            <div className="mx-auto flex w-full max-w-3xl justify-end p-4">
              <button onClick={() => setIsFormOpen(false)} className="text-sm font-medium text-slate-400 hover:text-white">✕ Cerrar</button>
            </div>
            <div className="flex-1 w-full max-w-2xl mx-auto h-full flex flex-col">
              <LeadflowApplicationForm />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}