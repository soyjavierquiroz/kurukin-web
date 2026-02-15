import { useEffect, useRef, useState } from 'react';
import { PainPoints } from './components/PainPoints';
import { AgenteEstelar } from './components/AgenteEstelar';
import { DigitalArchitecture } from './components/DigitalArchitecture';
import { Benefits } from './components/Benefits';
import { SocialProof } from './components/SocialProof';
import { FinalCTA } from './components/FinalCTA';
import { Link, Route, Routes } from 'react-router-dom';
import { ContactChat } from './pages/ContactChat';
import { ArrowRight, Bot, Check } from 'lucide-react';

// IMPORTACIÓN AÑADIDA: Tu nueva página de pruebas del reproductor
import { VideoTestPage } from './pages/VideoTestPage';

function HomePage() {
  const chatRef = useRef<HTMLDivElement | null>(null);
  const lastYRef = useRef(0);
  const hasAnimatedRef = useRef(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isFloatingButtonVisible, setIsFloatingButtonVisible] = useState(false);
  const [chatStep, setChatStep] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const goingUp = currentY < lastYRef.current;
      setIsHeaderVisible(goingUp || currentY < 30);
      setIsFloatingButtonVisible(currentY > 400);
      lastYRef.current = currentY;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const node = chatRef.current;
    if (!node) return;

    let timer2: number | undefined;
    let timer3: number | undefined;
    let timer4: number | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          setChatStep(1);
          timer2 = window.setTimeout(() => setChatStep(2), 800);
          timer3 = window.setTimeout(() => setChatStep(3), 1800);
          timer4 = window.setTimeout(() => setChatStep(4), 2800);
          observer.unobserve(node);
        }
      },
      { threshold: 0.6, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer2) window.clearTimeout(timer2);
      if (timer3) window.clearTimeout(timer3);
      if (timer4) window.clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 transition-transform duration-300',
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <a href="#hero" className="flex items-center gap-2 flex-shrink-0">
              <Bot className="w-7 h-7 text-cyan-400" />
              <span className="text-xl md:text-2xl font-bold text-white">Kurukin</span>
            </a>

            <Link
              to="/contactar/chatear"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 text-sm rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
            >
              WhatsApp
            </Link>
          </div>
        </div>
      </header>

      <section id="hero" className="relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-950"></div>

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-20 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Deja de ser el secretario de tu negocio:
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              vende mientras Kurukin responde.
            </span>
          </h1>

          <p className="text-base md:text-2xl text-slate-300 mb-6 max-w-4xl mx-auto">
            Este poderoso agente convierte cada mensaje de WhatsApp en una oportunidad real de ganar dinero, las 24 horas del día.
          </p>

          <div className="max-w-2xl mx-auto mb-6 grid sm:grid-cols-3 gap-2">
            <div className="inline-flex items-center justify-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm">
              <Check className="w-4 h-4 text-cyan-400" />
              Responde al instante
            </div>
            <div className="inline-flex items-center justify-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm">
              <Check className="w-4 h-4 text-cyan-400" />
              Conversación natural
            </div>
            <div className="inline-flex items-center justify-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm">
              <Check className="w-4 h-4 text-cyan-400" />
              Enfocado en vender
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <Link
              to="/contactar/chatear"
              className="group w-full md:w-auto min-h-[56px] bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 inline-flex items-center justify-center gap-2"
            >
              Ir a Probar Kurukin
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-slate-500 text-xs mt-2">Esto no es una explicación. Es una experiencia.</p>
          </div>
        </div>
      </section>

      <section ref={chatRef} className="relative px-4 md:px-6 py-8 md:py-14">
        <div className="relative max-w-5xl mx-auto">
          <div className="max-w-md mx-auto bg-[#0b141a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-cyan-900/20 overflow-hidden">
            <div className="border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full p-4">
              {chatStep >= 1 && (
                <div className="self-end ml-auto max-w-[85%] bg-cyan-700 text-white p-3 rounded-2xl rounded-tr-sm shadow-md transition-opacity duration-500 animate-fade-in animate-slide-up whitespace-pre-line">
                  <div>
                    Hola, ¿tienen disponibilidad para mañana?
                  </div>
                </div>
              )}

              {chatStep >= 2 && (
                <div className="self-start mr-auto max-w-[85%] bg-[#202c33] text-slate-100 p-3 rounded-2xl rounded-tl-sm shadow-md transition-opacity duration-500 animate-fade-in animate-slide-up whitespace-pre-line">
                  <div>
                    ¡Claro! 🙌 Tengo espacios a las 10:00, 14:00 y 16:00.{'\n\n'}¿Quieres que te reserve uno ahora?
                  </div>
                </div>
              )}

              {chatStep >= 3 && (
                <div className="self-end ml-auto max-w-[85%] bg-cyan-700 text-white p-3 rounded-2xl rounded-tr-sm shadow-md transition-opacity duration-500 animate-fade-in animate-slide-up whitespace-pre-line">
                  <div>
                    14:00 está perfecto.
                  </div>
                </div>
              )}

              {chatStep >= 4 && (
                <div className="self-start mr-auto max-w-[85%] bg-[#202c33] text-slate-100 p-3 rounded-2xl rounded-tl-sm shadow-md transition-opacity duration-500 animate-fade-in animate-slide-up whitespace-pre-line">
                  <div>
                    Listo ✅ Queda confirmada para mañana a las 14:00.{'\n\n'}¿Me compartes tu nombre para enviarte la
                    confirmación?
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-cyan-400 text-center mt-4">Y eso es solo el inicio. ¡Imagina las posibilidades!</p>
        </div>
      </section>

      <PainPoints />
      <AgenteEstelar />
      <DigitalArchitecture />
      <Benefits />
      <SocialProof />
      <FinalCTA />

      {isFloatingButtonVisible && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-slate-950/90 backdrop-blur-md border-t border-white/10 p-4 md:hidden">
          <Link
            to="/contactar/chatear"
            className="w-full min-h-[60px] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg inline-flex flex-col items-center justify-center"
          >
            <span>Probar Kurukin Ahora</span>
            <span className="text-[11px] text-cyan-100">Experiencia Instantánea</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/contactar/chatear" element={<ContactChat />} />
      
      {/* RUTA AÑADIDA: Tu laboratorio de pruebas */}
      <Route path="/video" element={<VideoTestPage />} />
    </Routes>
  );
}

export default App;