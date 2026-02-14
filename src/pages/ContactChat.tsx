import { useEffect, useRef, useState } from 'react';
import { Bot } from 'lucide-react';

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
  const hasRedirectedRef = useRef(false);

  const [countdown, setCountdown] = useState(5);
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            redirectToWhatsApp();
          }
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [redirectToWhatsApp]);

  const handleImmediateRedirect = () => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    redirectToWhatsApp();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="px-4 py-4 md:py-6 text-center border-b border-white/10">
        <div className="inline-flex items-center gap-2">
          <Bot className="w-6 h-6 text-cyan-400" />
          <span className="text-white text-xl font-bold">Kurukin</span>
        </div>
      </header>

      <main className="min-h-[calc(100vh-73px)] md:min-h-[calc(100vh-89px)] flex items-center justify-center px-4 py-6 overflow-hidden">
        <section className="w-full max-w-3xl text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-white mb-3">
            Deja de perder ventas por responder tarde.
          </h1>

          <p className="text-cyan-400 text-base md:text-xl animate-pulse mb-6">
            Preparando tu asistente virtual...
          </p>

          <div className="relative bg-slate-900/60 border border-white/10 rounded-2xl p-5 md:p-7 mb-6">
            <p className="text-2xl md:text-4xl font-extrabold text-white mb-4">
              Conectando con WhatsApp en {countdown}...
            </p>

            <button
              type="button"
              onClick={handleImmediateRedirect}
              className="w-full md:w-auto min-h-[56px] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-lg text-white px-8 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300"
            >
              No quiero esperar, abrir ahora ⚡
            </button>
          </div>

          <div className="max-w-md mx-auto bg-[#0b141a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-cyan-900/20 overflow-hidden mb-2 text-left opacity-80">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/90"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/90"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/90"></div>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <div className="opacity-100 translate-y-0 animate-fade-in animate-slide-up transition-all duration-500">
                <div className="self-start mr-auto w-fit max-w-[85%] bg-[#202c33] text-slate-100 p-3.5 rounded-2xl rounded-tl-sm shadow-md text-[15px] leading-relaxed">
                  Antes de empezar, ¿qué tipo de negocio tienes?
                </div>
              </div>

              <div
                className={[
                  'transition-all duration-500',
                  showMessage2 ? 'opacity-100 translate-y-0 animate-fade-in animate-slide-up' : 'opacity-0 translate-y-2',
                ].join(' ')}
              >
                <div className="self-end ml-auto w-fit max-w-[85%] bg-cyan-700 text-white p-3.5 rounded-2xl rounded-tr-sm shadow-md text-[15px] leading-relaxed">
                  Vendo servicios
                </div>
              </div>

              <div
                className={[
                  'transition-all duration-500',
                  showMessage3 ? 'opacity-100 translate-y-0 animate-fade-in animate-slide-up' : 'opacity-0 translate-y-2',
                ].join(' ')}
              >
                <div className="self-start mr-auto w-fit max-w-[85%] bg-[#202c33] text-slate-100 p-3.5 rounded-2xl rounded-tl-sm shadow-md text-[15px] leading-relaxed">
                  Perfecto. Entonces responderé como tu asistente comercial.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ContactChat;
