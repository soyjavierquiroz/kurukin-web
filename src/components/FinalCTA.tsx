import { ArrowRight, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

const WHATSAPP_LINK = 'https://kurukin.com/contactar/chatear';
const CALL_LINK = 'https://kurukin.com/contactar/agendar';

export function FinalCTA() {
  const forYou = [
    'Te escriben a diario por WhatsApp y sientes que te consume.',
    'Vendes productos o servicios y repites respuestas todo el tiempo.',
    'Quieres atender 24/7 sin contratar más gente.',
    'Quieres filtrar curiosos y quedarte con compradores.',
  ];

  const notForYou = [
    'Casi nadie te escribe por WhatsApp todavía.',
    'No tienes claro qué vendes o a qué precio.',
    'No quieres automatizar nada y prefieres responder todo a mano.',
  ];

  const faqs = [
    {
      q: '¿Kurukin responde como si fuera mi negocio?',
      a: 'Sí. Se entrena con tu info y tus reglas. Tú decides el tono, las respuestas y cuándo pasa a humano.',
    },
    {
      q: '¿Qué pasa si la conversación se complica?',
      a: 'Escala a una persona. Kurukin identifica cuándo es momento de que entres tú o tu equipo.',
    },
    {
      q: '¿Sirve para productos, servicios o infoproductos?',
      a: 'Sí. Mientras tengas preguntas repetibles y un proceso de venta por WhatsApp, se adapta.',
    },
    {
      q: '¿Cuánto tarda en implementarse?',
      a: 'Entre 24 y 72 horas, dependiendo de tu catálogo y complejidad. Lo hacemos guiado.',
    },
  ];

  return (
    <section id="final-cta" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/25 via-slate-900 to-slate-950"></div>

      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* 6) DEMO */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pruébalo ahora{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              (en vivo)
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Escríbele por WhatsApp y mira cómo responde. Si te sirve, lo configuramos para tu negocio.
          </p>

          <a
            href={WHATSAPP_LINK}
            className="inline-flex items-center justify-center gap-3 group bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Probar Kurukin en WhatsApp
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          <p className="text-slate-400 text-sm mt-3">Respuesta inmediata. Sin registro.</p>

          <div className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-slate-200/90">
            <span className="inline-flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-full px-4 py-2">
              ✅ Respuesta inmediata
            </span>
            <span className="inline-flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-full px-4 py-2">
              ✅ Configuración guiada
            </span>
            <span className="inline-flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-full px-4 py-2">
              ✅ Se adapta a tu negocio
            </span>
          </div>
        </div>

        {/* 7) PARA QUIÉN ES / NO ES */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">¿Kurukin es para ti?</h3>
            <ul className="space-y-4">
              {forYou.map((t, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-lg leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">No es para ti si:</h3>
            <ul className="space-y-4">
              {notForYou.map((t, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-200">
                  <XCircle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-lg leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 8) FAQ */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              Preguntas frecuentes
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((item, idx) => (
              <div
                key={idx}
                className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                    <h4 className="text-white font-bold text-lg">{item.q}</h4>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9) CTA FINAL */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl"></div>

          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-12 text-center">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Tu trabajo no es responder WhatsApp.{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Tu trabajo es vender.
              </span>
            </h3>

            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
              Prueba el sistema ahora. Si te gusta cómo responde, lo dejamos funcionando para tu negocio.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-stretch">
              <div className="flex flex-col items-center">
                <a
                  href={WHATSAPP_LINK}
                  className="group bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-12 py-5 rounded-lg font-bold text-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
                >
                  Probar Kurukin en WhatsApp
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </a>
                <p className="text-slate-400 text-sm mt-2">Demostración en vivo. Sin registro.</p>
              </div>

              <div className="flex flex-col items-center">
                <a
                  href={CALL_LINK}
                  className="text-white border-2 border-slate-700 hover:border-cyan-500 px-12 py-5 rounded-lg font-semibold text-xl transition-all duration-300 hover:bg-cyan-500/10 inline-flex items-center justify-center"
                >
                  Agendar llamada
                </a>
                <p className="text-slate-400 text-sm mt-2">Para negocios con alto volumen de mensajes.</p>
              </div>
            </div>

            <p className="text-slate-500 text-sm mt-10">
              Define reglas una vez. Responde mejor. Vende más.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative mt-24 pt-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-slate-400 text-sm">© 2026 Kurukin. Todos los derechos reservados.</div>
            <div className="flex gap-6 text-slate-400 text-sm">
              <a href="/terminos" className="hover:text-cyan-400 transition-colors">
                Términos
              </a>
              <a href="/privacidad" className="hover:text-cyan-400 transition-colors">
                Privacidad
              </a>
              <a href="/contactar" className="hover:text-cyan-400 transition-colors">
                Contacto
              </a>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
