import { ArrowRight, Sparkles } from 'lucide-react';

const WHATSAPP_LINK = 'https://kurukin.com/contactar/chatear';
const CALL_LINK = 'https://kurukin.com/contactar/agendar';

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-950"></div>

      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 text-sm font-medium">
            Respuesta inmediata en WhatsApp 24/7
          </span>
        </div>

        {/* H1 (Opción A) */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight animate-slide-up">
          Deja de ser el secretario de tu negocio:
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            vende mientras WhatsApp responde.
          </span>
        </h1>

        {/* Subheadline (2 líneas) */}
        <p className="text-lg md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto animate-slide-up delay-100">
          Kurukin atiende tus consultas por WhatsApp 24/7, responde coherente con tu negocio y solo te pasa los
          clientes que realmente valen la pena.
        </p>

        {/* Bullets (3) */}
        <div className="max-w-3xl mx-auto mb-10 animate-slide-up delay-150">
          <ul className="text-left text-slate-200/90 space-y-3">
            <li className="flex gap-3">
              <span className="mt-1 text-cyan-400">•</span>
              <span>Responde preguntas frecuentes al instante (precios, horarios, stock, servicios).</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-cyan-400">•</span>
              <span>Califica leads y te entrega los “listos para comprar”.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-cyan-400">•</span>
              <span>Agenda, deriva o cierra: según lo que tú definas.</span>
            </li>            
          </ul>
        </div>

        {/* CTAs + microtext */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-stretch mb-6 animate-slide-up delay-200">
          <div className="flex flex-col items-center">
            <a
              href={WHATSAPP_LINK}
              className="group bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              Probar Kurukin en WhatsApp
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-slate-400 text-sm mt-2">Demostración en vivo. Sin registro.</p>
          </div>

          <div className="flex flex-col items-center">
            <a
              href={CALL_LINK}
              className="text-white border-2 border-slate-700 hover:border-cyan-500 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-cyan-500/10 flex items-center justify-center"
            >
              Agendar llamada
            </a>
            <p className="text-slate-400 text-sm mt-2">Para negocios con alto volumen de mensajes.</p>
          </div>
        </div>

        {/* Proof bar */}
        <div className="inline-flex flex-wrap justify-center gap-x-4 gap-y-2 bg-slate-900/40 border border-slate-800 rounded-full px-5 py-2 text-sm text-slate-200/90 animate-fade-in delay-300">
          <span>✅ Respuesta inmediata</span>
          <span className="text-slate-500">|</span>
          <span>✅ Configuración guiada</span>
          <span className="text-slate-500">|</span>
          <span>✅ Se adapta a tu negocio</span>
        </div>

        {/* Demo visual */}
        <div className="relative max-w-4xl mx-auto mt-12 animate-fade-in delay-300">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl"></div>
          <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>

            <div className="space-y-3 text-left">
              <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-cyan-500">
                <p className="text-slate-400 text-sm mb-1">Cliente 23:47</p>
                <p className="text-white">¿Tienen disponibilidad para mañana?</p>
              </div>

              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-slate-400 text-sm mb-1">Kurukin 23:47</p>
                <p className="text-white">¡Sí! Tengo espacios a las 10:00, 14:00 y 16:00. ¿Cuál te conviene?</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-cyan-500">
                <p className="text-slate-400 text-sm mb-1">Cliente 23:48</p>
                <p className="text-white">Las 14:00 está perfecto</p>
              </div>

              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-slate-400 text-sm mb-1">Kurukin 23:48</p>
                <p className="text-white">
                  Listo ✅ Queda agendado para mañana a las 14:00. ¿Me confirmas tu nombre y el servicio que buscas?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
