import { MessageSquare, Target, ShoppingCart, Headphones, Workflow, Sparkles } from 'lucide-react';

export function AgenteEstelar() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Conversaciones Hiper-Realistas',
      description: 'Tus clientes ni notarán que es IA. ¡Interacciones fluidas y personalizadas!',
    },
    {
      icon: Target,
      title: 'Calificación de Leads Impecable',
      description: 'Solo te llegan los prospectos listos para comprar. ¡Adiós al "curioso"!',
    },
    {
      icon: ShoppingCart,
      title: 'Cierre de Ventas Automatizado',
      description: 'Envío de catálogos, enlaces de pago y agendamiento, sin levantar un dedo.',
    },
    {
      icon: Headphones,
      title: 'Soporte al Cliente Instantáneo',
      description: 'Resolución de dudas frecuentes en segundos, liberando a tu equipo.',
    },
    {
      icon: Workflow,
      title: 'Integración Perfecta',
      description: 'Conecta con tu CRM, inventario y más, para una operación sin fricciones.',
    },
    {
      icon: Sparkles,
      title: 'Aprendizaje Continuo',
      description: 'Se adapta y mejora con cada interacción, volviéndose más inteligente cada día.',
    },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 text-sm font-medium">El Agente Estelar</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Tu Vendedor, Community Manager
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              y Soporte Técnico... todo en uno y 24/7
            </span>
          </h2>

          <p className="text-xl text-slate-400 max-w-4xl mx-auto">
            Presentamos la Inteligencia Artificial que no solo conversa, sino que cierra ventas,
            resuelve dudas y te escala sin límites.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-cyan-400" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400 text-lg">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Imagina despertar cada día sabiendo que tu negocio ya generó ventas
            </h3>
            <p className="text-xl text-slate-300 mb-8">
              La tranquilidad de tener un equipo incansable trabajando para ti.
            </p>
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105">
              Quiero Mi Agente Estelar Ahora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
