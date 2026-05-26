import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, XCircle } from 'lucide-react';
import { KurukinPlayer } from 'kurukin-video-player';
import LeadflowApplicationForm from '../components/LeadflowApplicationForm';
import { trackPageView } from '../lib/analytics';

const VSL_REVEAL_SECONDS = 60; // Cambiar este valor para ajustar el tiempo de aparición del botón y contenido
const LEADFLOW_VIDEO_URL = 'https://vz-febf8c0d-fb8.b-cdn.net/82f82aa1-a2a3-43f9-862b-f60fadc0fdc0/playlist.m3u8';

const ctaBaseClassName = [
  'group inline-flex w-full min-h-[64px] items-center justify-center gap-3 rounded-2xl',
  'bg-gradient-to-r from-amber-400 to-amber-600 px-8 py-4 text-center text-lg font-bold uppercase text-slate-950',
  'shadow-[0_16px_32px_rgba(0,0,0,0.5)] animate-pulse transition-all hover:scale-105',
  'sm:w-auto',
].join(' ');

const glassPanelClassName = [
  'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-md',
  'transition duration-300 hover:border-zinc-700',
].join(' ');

const problemBullets = [
  'Si dejas de trabajar, el equipo se detiene',
  'Los nuevos no duplican lo que haces',
  'Tu equipo no sabe cerrar sin ti',
  'No hay duplicación real',
];

const filterBullets = [
  '✔ Tienes un equipo de al menos 10 miembros activos y dispuestos',
  '✔ Junto a tu equipo pueden invertir al menos $ 1,000 USD en publicidad',
  '✔ Tu oferta y negocio es real y ya convierte',
];

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
  const [isContentRevealed, setIsContentRevealed] = useState(false);
  const [distribuidoresActivos, setDistribuidoresActivos] = useState(20);
  const conversacionesMuertas = distribuidoresActivos * 5;

  useEffect(() => {
    void trackPageView();
  }, []);

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
    <div className="min-h-screen overflow-hidden bg-black text-white">
      {/* Estilos inyectados para la animación del Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      `}</style>

      <main>
        {/* HERO SECTION - CTA Visible en todo dispositivo */}
        <section id="hero" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_26%)]" />
          <div className="pointer-events-none absolute right-0 top-20 h-[420px] w-[420px] rounded-full bg-zinc-900/30 blur-[120px]" />
          <div className="pointer-events-none absolute left-1/2 top-44 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-neutral-900/30 blur-[120px]" />
          
          <div className="relative mx-auto grid max-w-7xl gap-5 px-4 pt-4 pb-16 sm:px-6 sm:pt-6 md:pt-8 md:pb-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-14 lg:py-24">
            <div className="text-center lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400 sm:text-sm sm:tracking-[0.32em]">
                ATENCIÓN LÍDERES SERIOS DE MULTINIVEL
              </p>

              <h1 className="mt-4 text-3xl font-bold leading-[1.02] text-white sm:text-4xl md:text-5xl">
                Si tu equipo MLM no prospecta sin ti...{' '}
                <span className="text-amber-400">tienes un empleo disfrazado.</span>
              </h1>
            </div>

            <div className="hidden max-w-none lg:block">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">
                ATENCIÓN LÍDERES SERIOS DE MULTINIVEL
              </p>

              <h1 className="mt-5 text-3xl font-bold leading-[1.02] text-white md:text-6xl">
                Si tu equipo MLM no prospecta sin ti...{' '}
                <span className="text-amber-400">tienes un empleo disfrazado.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
                Con LeadFlow genera de 5 a 10 interesados diarios para cada miembro de tu equipo - sin crear contenido ni depender de algoritmos.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="absolute -inset-8 rounded-full bg-zinc-900/30 blur-[120px]" />
              <div className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 p-2 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-md">
                <div className="aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-black">
                  <KurukinPlayer
                    provider="bunnynet"
                    videoId={LEADFLOW_VIDEO_URL}
                    vslMode={true}
                    resumePlayback={true}
                    vslProgressBarColor="#dc2626"
                    onTimeUpdate={(currentTime) => {
                      if (currentTime >= VSL_REVEAL_SECONDS && !isContentRevealed) setIsContentRevealed(true);
                    }}
                    smartPoster={{
                      eyebrow: 'Mensaje Urgente',
                      title: 'Haz clic para ver por qué tu equipo no crece',
                      description: 'Haz clic y escucha el punto exacto que está matando la duplicación.',
                      buttonText: 'Ver mensaje',
                    }}
                    className="h-full w-full [&_video]:object-cover [&_video]:!filter-none [&_.backdrop-blur-md]:!backdrop-blur-none [&_.backdrop-blur-sm]:!backdrop-blur-none [&_.blur]:!blur-none"
                  />
                </div>
              </div>
            </div>

            <p className="mx-auto max-w-2xl text-center text-base leading-relaxed text-slate-300 sm:text-lg md:text-xl lg:hidden">
              Con LeadFlow genera de 5 a 10 interesados diarios para cada miembro de tu equipo - sin crear contenido ni depender de algoritmos.
            </p>
          </div>
        </section>

        {isContentRevealed && (
          <div className="animate-in fade-in duration-1000">
            {/* FRANJA DE VALIDACIÓN CON ANIMACIÓN MARQUEE */}
            <section className="overflow-hidden border-y border-white/5 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <p className="text-lg font-medium leading-relaxed text-slate-300 md:text-xl lg:text-2xl">
                Equipos MLM hispanos ya están usando sistemas automatizados de adquisición para generar prospectos y{' '}
                <br className="hidden md:block" />
                empujar duplicación real todos los días.
              </p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Redes en estas compañías ya se están moviendo...
              </p>
            </div>
          </div>

          <div className="relative mx-auto flex max-w-7xl overflow-hidden">
            <div className="absolute bottom-0 left-0 top-0 z-10 w-16 bg-gradient-to-r from-black to-transparent sm:w-32" />
            <div className="absolute bottom-0 right-0 top-0 z-10 w-16 bg-gradient-to-l from-black to-transparent sm:w-32" />
            {/* Contenedor animado */}
            <div className="animate-marquee items-center hover:[animation-play-state:paused]">
              {[...mlmLogos, ...mlmLogos].map((logo, index) => (
                <div key={index} className="mx-6 flex w-24 flex-shrink-0 items-center justify-center opacity-55 transition-all duration-300 hover:opacity-90 sm:mx-10 sm:w-32">
                  <img src={logo} alt={`Logo MLM ${index}`} className="h-auto w-full object-contain grayscale brightness-200" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIÓN DEPENDENCIA - RESTAURADA E INVERTIDA */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-32 top-24 h-[360px] w-[360px] rounded-full bg-zinc-900/30 blur-[120px]" />
          <div className="pointer-events-none absolute right-0 bottom-10 h-[420px] w-[420px] rounded-full bg-neutral-900/30 blur-[120px]" />
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              
              {/* Bloque de Imagen - Izquierda en desktop */}
              <div className="relative lg:order-1 order-2">
                <div className="absolute -inset-6 rounded-full bg-zinc-900/30 blur-[120px]" />
                <img 
                  src="https://cdn.kuruk.in/leadflow-assets/landing/dependencia.webp" 
                  alt="Duplicación bloqueada por dependencia" 
                  className="relative rounded-[2rem] border border-zinc-800 grayscale contrast-125 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
                />
              </div>

              {/* Bloque de Texto - Derecha en desktop */}
              <div className="lg:order-2 order-1">
                <h2 className="text-3xl font-bold leading-[1.1] text-white md:text-5xl">
                  Si hoy el equipo no se mueve sin ti, no tienes duplicación. <span className="text-amber-400">Tienes dependencia.</span>
                </h2>
                <p className="mt-8 text-lg font-bold text-slate-300">
                  👉 Esto es lo que realmente está pasando en tu equipo:
                </p>
                <div className="mt-5 space-y-4">
                  {problemBullets.map((item) => (
                    <div key={item} className={`${glassPanelClassName} group flex items-center gap-4`}>
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                        <XCircle className="h-6 w-6 text-amber-400 transition-transform group-hover:scale-110" />
                      </div>
                      <p className="text-lg font-medium text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 md:py-24">
            <h2 className="text-3xl font-bold leading-tight text-white md:text-5xl">
              El problema no es tu equipo. Es que no tienen sistema.
            </h2>
          </div>
        </section>

        {/* SECCIÓN SISTEMA - CTA Solo Desktop */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.035),transparent_32%)]" />
          <div className="pointer-events-none absolute left-1/4 top-20 h-[380px] w-[380px] rounded-full bg-zinc-900/30 blur-[120px]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <div className="max-w-4xl">
              <h2 className="text-3xl font-bold leading-tight text-white md:text-5xl">
                Así es como tu equipo empieza a moverse y <span className="text-amber-400">crecer de forma predecible mes a mes</span>
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
                Funciona porque es simple: cuando tu equipo recibe conversaciones todos los días, la tracción deja de depender de unos pocos y empieza a correr como sistema.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)] lg:items-center">
              <div className="ml-3 border-l-2 border-zinc-700 pl-6 space-y-6">
                {[
                  ['01', 'Ayudamos a líderes MLM con +20 personas a generar 3–10 conversaciones diarias en 7 días', 'Sin perseguir, sin crear contenido diario.'],
                  ['02', 'LeadFlow asigna prospectos automáticamente a tu equipo', 'Cada miembro recibe conversaciones listas para activar seguimiento.'],
                  ['03', 'Tu equipo inicia conversaciones y da seguimiento a prospectos todos los días', 'Guiones simples + seguimiento automático = conversaciones diarias.'],
                ].map(([number, title, description]) => (
                  <div key={number} className={`${glassPanelClassName} relative rounded-xl`}>
                    <div className="absolute -left-[34px] top-6 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-300 shadow-[0_8px_16px_rgba(0,0,0,0.5)]" />
                    <div className="text-sm font-bold tracking-[0.28em] text-amber-400">{number}</div>
                    <h3 className="mt-3 text-2xl font-bold text-white">{title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-400 md:text-lg">{description}</p>
                  </div>
                ))}
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-zinc-900/40 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img src="https://cdn.kuruk.in/leadflow-assets/landing/sindependencia.webp" alt="Diagrama de flujo" className="relative rounded-[2rem] border border-zinc-800 grayscale contrast-125 shadow-[0_20px_80px_rgba(0,0,0,0.6)] w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]" />
              </div>
            </div>

            <div className="mt-12">
              <LeadflowCta
                text="Quiero que mi equipo genere prospectos ahora"
                onClick={() => setIsFormOpen(true)}
                className="hidden lg:block" 
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute right-10 top-12 h-[420px] w-[420px] rounded-full bg-zinc-900/30 blur-[120px]" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-neutral-900/30 blur-[120px]" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <h2 className="text-2xl font-black leading-tight text-white md:text-4xl">
                  ¿Cuánto volumen está perdiendo tu equipo hoy por falta de infraestructura?
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-slate-400">
                  Mueve el control y mira cuánto seguimiento muere cada semana cuando tu red no tiene una máquina de
                  adquisición corriendo en automático.
                </p>
              </div>

              <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-400">
                    Simulador de duplicación muerta
                  </p>
                  <p className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm font-black text-white">
                    {distribuidoresActivos}
                  </p>
                </div>

                <input
                  type="range"
                  min={1}
                  max={100}
                  value={distribuidoresActivos}
                  onChange={(event) => setDistribuidoresActivos(Number(event.target.value))}
                  className="mt-8 h-3 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-zinc-300 outline-none [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.08)] [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-zinc-200 [&::-moz-range-thumb]:shadow-[0_10px_24px_rgba(0,0,0,0.45)] [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-zinc-200 [&::-webkit-slider-thumb]:shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                  aria-label="Cantidad de líderes activos"
                />

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className={glassPanelClassName}>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Estructura estancada
                    </p>
                    <p className="mt-3 text-3xl font-black text-white">{distribuidoresActivos} líderes</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl backdrop-blur-md transition duration-300 hover:border-zinc-700">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-400">
                      Conversiones cualificadas que tu red deja morir por semana
                    </p>
                    <p className="mt-3 text-4xl font-black text-amber-400 md:text-5xl">{conversacionesMuertas}</p>
                  </div>
                </div>

                <p className="mt-8 text-lg font-semibold leading-relaxed text-slate-300">
                  Esto no se arregla con más motivación ni con zooms de equipo. Si tu gente no tiene leads diarios en
                  frío, tu duplicación está muerta. LeadFlow automatiza este volumen sin que tú muevas un dedo.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">⚠️ Esto no es para todos</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white md:text-5xl">LeadFlow es para líderes con equipo que están listos para duplicación masiva. Si estás empezando, esto no es para ti.</h2>
            <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              {filterBullets.map((item) => (
                <div key={item} className="py-5 text-lg text-slate-300">{item}</div>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIÓN GARANTÍA - CTA Solo Desktop */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-zinc-900/30 blur-[120px]" />
          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
            <div className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-8 text-white shadow-2xl backdrop-blur-md md:p-12">
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="h-16 w-16 text-amber-500" />
                <h2 className="mt-6 text-3xl font-bold md:text-5xl">Si en 30 días tu equipo no está generando conversaciones diarias con prospectos reales, seguimos trabajando contigo hasta lograrlo.</h2>
                <div className="mt-10">
                  <LeadflowCta 
                    text="Quiero aplicar para LEADFLOW" 
                    onClick={() => setIsFormOpen(true)} 
                    className="hidden lg:block"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER SECTION CON DISCLAIMERS */}
        <footer className="border-t border-white/10 py-16 text-slate-400">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <div className="mb-10 flex flex-col items-center justify-center space-y-2">
              <p className="text-lg font-bold text-white tracking-tight">LeadFlow by KuruKin</p>
              <p className="text-xs uppercase tracking-[0.2em]">Copyright © 2026 - Todos los derechos reservados</p>
            </div>

            <div className="grid gap-8 text-[10px] leading-relaxed md:text-[11px]">
              <div className="space-y-4">
                <p>
                  <strong>DESCARGO DE RESPONSABILIDAD DE RESULTADOS:</strong> Los resultados mencionados anteriormente son mis resultados personales y de mis clientes. Por favor, comprende que estos resultados no son típicos y no estoy sugiriendo que los duplicarás (o harás algo al respecto). Tu éxito depende de muchos factores, incluidos tu historial, capacidad, ética de trabajo y enfoque. Todo negocio conlleva riesgos, así como esfuerzos y acciones masivas y consistentes. Si no estás dispuesto a aceptar eso, por favor NO intentes trabajar con nosotros.
                </p>
                <p>
                  Este sitio no es parte del sitio web de Facebook o Meta Platforms, Inc. Además, este sitio NO está respaldado por Meta de ninguna manera. FACEBOOK y META son marcas comerciales de Meta Platforms, Inc.
                </p>
                <p>
                  Este sitio no es parte del sitio web de TikTok o TikTok Inc. Además, este sitio NO está respaldado por TikTok de ninguna manera. TIKTOK es una marca comercial de TikTok Inc.
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                <a href="#" className="hover:text-amber-400 transition-colors">Políticas de Privacidad</a>
                <a href="#" className="hover:text-amber-400 transition-colors">Términos de Servicio</a>
                <a href="#" className="hover:text-amber-400 transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </footer>

          </div>
        )}

        {/* CTA STICKY UNIVERSAL - Aparece por VSL Timer */}
        {isContentRevealed && (
          <div className="fixed bottom-0 left-0 right-0 z-[60] animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="absolute inset-0 border-t border-white/10 bg-black/90 backdrop-blur-xl" />
            <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 p-4 md:flex-row md:px-6 md:py-4">
              
              {/* Texto visible solo en Desktop */}
              <div className="hidden md:block">
                <p className="text-lg font-bold text-white">Tu equipo necesita infraestructura, no más motivación.</p>
                <p className="text-sm font-medium text-slate-400">Solo aceptamos 5 equipos listos para duplicación masiva este mes.</p>
              </div>

              {/* Botón de Acción */}
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex w-full flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-8 py-3 font-bold uppercase text-slate-950 shadow-[0_16px_32px_rgba(0,0,0,0.5)] transition-transform active:scale-95 md:w-auto hover:scale-105"
              >
                <span className="text-base md:text-lg uppercase tracking-tight">Aplicar a LeadFlow ahora</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.1em] opacity-90 md:hidden">
                  Solo 5 equipos este mes
                </span>
              </button>
            </div>
          </div>
        )}

        {/* MODAL FORMULARIO */}
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-black/95 backdrop-blur-md">
            <div className="pointer-events-none absolute inset-x-0 top-1/4 mx-auto h-[520px] w-[520px] rounded-full bg-zinc-900/30 blur-[120px]" />
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
