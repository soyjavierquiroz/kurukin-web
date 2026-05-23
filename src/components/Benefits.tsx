import { CheckCircle2 } from 'lucide-react';

export function Benefits() {
  const benefits = [
    'Más ventas por responder a tiempo.',
    'Más foco en cerrar, no en chatear.',
    'Clientes mejor atendidos, con mensajes consistentes.',
    'Menos leads basura y más conversaciones útiles.',
    'Menos carga operativa sin contratar una secretaria.',
    'Proceso de WhatsApp escalable (sin depender de ti).',
  ];

  return (
    <section id="benefits" className="relative py-20 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-black"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Lo que ganas cuando{' '}
            <span className="text-amber-400">
              dejas de responder todo tú
            </span>
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {benefits.map((text, idx) => (
            <div
              key={idx}
              className="group relative bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/40"
            >
              <div className="absolute inset-0 bg-zinc-900/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative flex gap-4">
                <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-slate-200 text-lg leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
