import { Clock, TrendingDown, Flame, BarChart3 } from 'lucide-react';

export function PainPoints() {
  const symptoms = [
    {
      icon: Clock,
      text: 'Te escriben cuando estás ocupado… y cuando respondes ya compraron en otro lado.',
    },
    {
      icon: BarChart3,
      text: 'Repites lo mismo 50 veces al día (precios, catálogo, horarios).',
    },
    {
      icon: TrendingDown,
      text: 'Pierdes clientes buenos por estar atendiendo clientes malos.',
    },
    {
      icon: Flame,
      text: 'Tu WhatsApp manda, y tu negocio obedece.',
    },
  ];

  return (
    <section id="pain-points" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Tu negocio no necesita más mensajes.{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Necesita responder mejor y más rápido.
            </span>
          </h2>

          <p className="text-xl text-slate-400 max-w-4xl mx-auto">
            Si pagas tráfico, publicas contenido o te recomiendan, pero respondes tarde… estás comprando leads para
            otros. Cada “hola, info” sin respuesta es una venta perdida.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {symptoms.map((item, index) => (
            <div
              key={index}
              className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-cyan-400" />
                </div>

                <p className="text-slate-200 text-lg leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
