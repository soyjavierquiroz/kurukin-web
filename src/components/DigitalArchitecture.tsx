import { MessageSquare, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

const WHATSAPP_LINK = 'https://kurukin.com/contactar/chatear';

export function DigitalArchitecture() {
  const steps = [
    {
      icon: MessageSquare,
      title: '1) Conectamos tu WhatsApp',
      description:
        'Integramos tu canal y definimos qué quieres que ocurra en cada tipo de conversación.',
    },
    {
      icon: BookOpen,
      title: '2) Cargamos tu info',
      description:
        'Catálogo, servicios, precios, horarios, políticas, y lo que tus clientes preguntan siempre.',
    },
    {
      icon: CheckCircle2,
      title: '3) Kurukin atiende y tú solo cierras',
      description:
        'Respuestas 24/7 + filtrado + escalamiento cuando realmente vale la pena.',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 px-6 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Cómo funciona{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              (en 3 pasos)
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <step.icon className="w-8 h-8 text-cyan-400" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-slate-300 text-lg">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="relative bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent rounded-2xl"></div>

          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-4">Pruébalo ahora (en vivo)</h3>
              <p className="text-xl text-slate-300 mb-6">
                Escríbele por WhatsApp y mira cómo responde. Si te sirve, lo configuramos para tu negocio.
              </p>

              <a
                href={WHATSAPP_LINK}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
              >
                Probar Kurukin en WhatsApp
                <ArrowRight className="w-5 h-5" />
              </a>

              <p className="text-slate-400 text-sm mt-3">Respuesta inmediata. Sin registro.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
              <div className="space-y-4">
                <div className="text-slate-200 font-semibold">Lo que queda definido contigo:</div>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-cyan-400">•</span>
                    Respuestas clave (precios, horarios, stock, servicios)
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-cyan-400">•</span>
                    Reglas de filtrado (qué es “listo para comprar”)
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-cyan-400">•</span>
                    Cuándo agenda y cuándo pasa a humano
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
