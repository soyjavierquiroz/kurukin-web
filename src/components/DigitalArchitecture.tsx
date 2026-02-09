import { Globe, Target, Settings } from 'lucide-react';

export function DigitalArchitecture() {
  const services = [
    {
      icon: Globe,
      title: 'Sitios Web de Alta Conversión',
      description: 'Diseño optimizado para captar y convertir a cada visitante en cliente.',
      features: ['Diseño Responsive', 'SEO Optimizado', 'Velocidad Ultra-Rápida'],
    },
    {
      icon: Target,
      title: 'Landing Pages Estratégicas',
      description: 'Embúdos imparables para tus campañas de marketing digital.',
      features: ['Copy Persuasivo', 'A/B Testing', 'Alta Conversión'],
    },
    {
      icon: Settings,
      title: 'Sistemas Personalizados',
      description: 'Soluciones a medida para cada proceso único de tu negocio.',
      features: ['Integraciones API', 'Dashboards', 'Automatizaciones'],
    },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            No es solo un bot, es un{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Ecosistema de Crecimiento
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Tu Agente de IA necesita una base sólida. Construimos la infraestructura digital
            que potencia su rendimiento y multiplica tus resultados.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <service.icon className="w-8 h-8 text-cyan-400" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
              <p className="text-slate-400 mb-6">{service.description}</p>

              <ul className="space-y-3">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="relative bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent rounded-2xl"></div>

          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Olvídate de la complejidad técnica
              </h3>
              <p className="text-xl text-slate-300 mb-6">
                Nosotros construimos el ecosistema, tú recoges los frutos.
              </p>
              <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105">
                Construir Mi Ecosistema Digital
              </button>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-5/6 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
