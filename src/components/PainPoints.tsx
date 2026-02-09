import { Clock, TrendingDown, Flame, BarChart3 } from 'lucide-react';

export function PainPoints() {
  const painPoints = [
    {
      icon: Clock,
      title: 'Pérdida de Tiempo',
      description: 'Horas valiosas dedicadas a responder lo mismo una y otra vez.',
    },
    {
      icon: TrendingDown,
      title: 'Ventas Perdidas',
      description: 'Prospectos que nunca se convierten por falta de atención inmediata.',
    },
    {
      icon: Flame,
      title: 'Sobrecarga Operativa',
      description: 'Tu equipo quemado, haciendo tareas repetitivas sin valor estratégico.',
    },
    {
      icon: BarChart3,
      title: 'Escalabilidad Nula',
      description: 'Tu crecimiento limitado por la capacidad humana.',
    },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Mientras tú duermes,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ¿quién vende?
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            El costo invisible de operar a mano: clientes perdidos, equipos saturados y oportunidades que se esfuman.
            <span className="text-white font-semibold"> Ya no más.</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <point.icon className="w-6 h-6 text-cyan-400" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{point.title}</h3>
                <p className="text-slate-400">{point.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-lg px-8 py-6">
            <p className="text-2xl font-bold text-white mb-2">
              ¿Sabes cuántas ventas pierdes mientras duermes?
            </p>
            <p className="text-lg text-slate-300">
              Tus competidores no.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
