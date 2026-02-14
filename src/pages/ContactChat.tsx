import { useEffect, useState } from 'react';
import { Bot, Check, Clock3, MessageCircle, Target, TrendingUp } from 'lucide-react';

function useWhatsAppRedirect() {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER ?? '';
  const message = import.meta.env.VITE_WHATSAPP_MESSAGE ?? '';

  const getWhatsAppUrl = () => {
    const userAgent = navigator.userAgent || '';
    const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
    const baseUrl = isMobile ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
    const phone = encodeURIComponent(number);
    const text = encodeURIComponent(message);

    return `${baseUrl}?phone=${phone}&text=${text}`;
  };

  const redirectToWhatsApp = () => {
    window.location.href = getWhatsAppUrl();
  };

  return { redirectToWhatsApp };
}

export function ContactChat() {
  const { redirectToWhatsApp } = useWhatsAppRedirect();
  const [showMessage2, setShowMessage2] = useState(false);
  const [showMessage3, setShowMessage3] = useState(false);

  useEffect(() => {
    const timer2 = window.setTimeout(() => setShowMessage2(true), 600);
    const timer3 = window.setTimeout(() => setShowMessage3(true), 1200);

    return () => {
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="px-4 py-4 md:py-6 text-center border-b border-white/10">
        <div className="inline-flex items-center gap-2">
          <Bot className="w-6 h-6 text-cyan-400" />
          <span className="text-white text-xl font-bold">Kurukin</span>
        </div>
      </header>

      <main className="relative px-4 pb-28 md:pb-16">
        <section className="relative py-6 md:py-10 max-w-3xl mx-auto text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-white mb-4">
            Deja de perder ventas por responder tarde.
          </h1>

          <p className="text-slate-400 text-base md:text-xl mb-5 max-w-2xl mx-auto">
            En menos de 30 segundos puedes ver cómo sería tener un asistente que responde por ti 24/7.
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
            <li className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm inline-flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              Responde al instante
            </li>
            <li className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm inline-flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              Conversación natural
            </li>
            <li className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm inline-flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              Enfocado en vender
            </li>
          </ul>

          <p className="text-sm text-slate-500 italic mb-4">Esto no es una explicación. Es una experiencia.</p>

          <button
            type="button"
            onClick={redirectToWhatsApp}
            className="w-full md:w-auto h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-lg text-white px-8 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300"
          >
            Hablar con Kurukin ahora
          </button>

          <p className="text-xs text-slate-400 mt-2">Sin registro. Sin compromiso. Respuesta inmediata.</p>
        </section>

        <section className="py-6 md:py-8 max-w-3xl mx-auto text-center">
          <p className="text-sm text-cyan-400 mb-4">Así empieza la conversación…</p>

          <div className="max-w-md mx-auto bg-[#0b141a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-cyan-900/20 overflow-hidden mb-6 text-left">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/90"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/90"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/90"></div>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <div className="opacity-100 translate-y-0 animate-fade-in animate-slide-up transition-all duration-500">
                <div className="self-start mr-auto w-fit max-w-[85%] bg-[#202c33] text-slate-100 p-3.5 rounded-2xl rounded-tl-sm shadow-md text-[15px] leading-relaxed">
                  <p className="text-slate-100 text-[15px] leading-relaxed">Antes de empezar, ¿qué tipo de negocio tienes?</p>
                </div>
              </div>

              <div
                className={[
                  'transition-all duration-500',
                  showMessage2 ? 'opacity-100 translate-y-0 animate-fade-in animate-slide-up' : 'opacity-0 translate-y-2',
                ].join(' ')}
              >
                <div className="self-end ml-auto w-fit max-w-[85%] bg-cyan-700 text-white p-3.5 rounded-2xl rounded-tr-sm shadow-md text-[15px] leading-relaxed">
                  <p className="text-white text-[15px] leading-relaxed">Vendo servicios</p>
                </div>
              </div>

              <div
                className={[
                  'transition-all duration-500',
                  showMessage3 ? 'opacity-100 translate-y-0 animate-fade-in animate-slide-up' : 'opacity-0 translate-y-2',
                ].join(' ')}
              >
                <div className="self-start mr-auto w-fit max-w-[85%] bg-[#202c33] text-slate-100 p-3.5 rounded-2xl rounded-tl-sm shadow-md text-[15px] leading-relaxed">
                  <p className="text-slate-100 text-[15px] leading-relaxed">Perfecto. Entonces responderé como tu asistente comercial.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-slate-400 mt-4">Y eso es solo el inicio.</p>
        </section>

        <section className="py-6 md:py-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            La mayoría de emprendedores no necesita más leads.
          </h2>
          <div className="space-y-3 text-slate-300 text-lg md:text-2xl leading-relaxed">
            <p>Necesita responder mejor los que ya tiene.</p>
            <p>Cada mensaje no atendido es dinero perdido.</p>
            <p>Cada respuesta tardía es una venta que se va.</p>
            <p>Aquí puedes experimentar cómo se siente responder siempre a tiempo.</p>
          </div>
          <p className="text-cyan-300 text-lg md:text-xl font-semibold mt-6">Y lo vas a notar desde el primer mensaje.</p>
        </section>

        <section className="py-6 md:py-10 max-w-3xl mx-auto">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 md:p-8">
            <h3 className="text-2xl md:text-4xl font-bold text-white mb-6 text-center">
              Lo que vas a notar cuando empieces a escribir:
            </h3>

            <ul className="space-y-4 text-slate-200">
              <li className="flex items-start gap-3">
                <Clock3 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Te responde en segundos.</span>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Entiende tu intención.</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Hace preguntas para calificar.</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Te guía hacia una acción.</span>
              </li>
            </ul>

            <p className="text-cyan-300 text-lg md:text-xl font-semibold mt-6 text-center">
              Y todo ocurre como si trabajara para tu negocio.
            </p>
            <p className="text-slate-500 text-sm mt-2 text-center">No es teoría. Es interacción real.</p>
          </div>
        </section>

        <section className="py-6 md:py-8 max-w-3xl mx-auto text-center">
          <p className="text-cyan-300 text-xl font-semibold mb-5">
            Sí, quiero que mi negocio responda como si tuviera un asistente 24/7.
          </p>
          <button
            type="button"
            onClick={redirectToWhatsApp}
            className="w-full md:w-auto h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-lg text-white px-8 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300"
          >
            Presiona para ir a WhatsApp
          </button>
        </section>

        <section className="py-6 md:py-12 max-w-5xl mx-auto text-center">
          <p className="text-cyan-300 text-lg md:text-xl font-bold mb-3">
            Mientras tú respondes mensajes, alguien más está cerrando ventas.
          </p>
          <h3 className="text-3xl md:text-6xl font-extrabold text-white leading-tight mb-5">
            Tu trabajo no es contestar mensajes. Tu trabajo es cerrar ventas.
          </h3>
          <p className="text-slate-300 text-base md:text-xl mb-8 max-w-3xl mx-auto">
            Prueba ahora la experiencia. Son 30 segundos que pueden cambiar cómo operas tu negocio.
          </p>
          <button
            type="button"
            onClick={redirectToWhatsApp}
            className="w-full md:w-auto h-14 md:h-16 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-lg md:text-xl text-white px-10 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300"
          >
            Chatear con Kurukin ahora
          </button>
          <p className="text-slate-400 text-sm mt-3">Disponible 24/7.</p>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full z-50 p-4 bg-slate-950/90 backdrop-blur-md border-t border-white/10 md:hidden">
        <button
          type="button"
          onClick={redirectToWhatsApp}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-lg text-white shadow-2xl shadow-cyan-500/30"
        >
          Hablar con Kurukin ahora
        </button>
      </div>
    </div>
  );
}

export default ContactChat;
