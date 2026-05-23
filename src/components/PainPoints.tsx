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
    <section id="pain-points" className="relative py-20 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-black"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Tu negocio no necesita más mensajes.{' '}
            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
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
              className="group relative bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-zinc-900/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative">
                <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-amber-300" />
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
