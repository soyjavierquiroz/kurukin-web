import { MessageSquare, Target, Calendar, BookOpen, Sparkles } from 'lucide-react';

const WHATSAPP_LINK = 'https://kurukin.com/contactar/chatear';

export function AgenteEstelar() {
  const cards = [
    {
      icon: MessageSquare,
      title: 'Responde al instante',
      description: 'Contesta preguntas comunes con mensajes claros y consistentes.',
    },
    {
      icon: Target,
      title: 'Filtra y califica',
      description: 'Detecta intención de compra y prioriza a quien tiene más probabilidad de pagar.',
    },
    {
      icon: Calendar,
      title: 'Agenda o deriva',
      description: 'Cuando el cliente está listo, agenda o lo pasa a un humano.',
    },
    {
      icon: BookOpen,
      title: 'Aprende tu negocio',
      description: 'Se entrena con tu catálogo, servicios y preguntas reales.',
    },
  ];

  return (
    <section id="agente-estelar" className="relative py-20 px-6 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 text-sm font-medium">La solución, simple</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Kurukin hace el trabajo de atención.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Tú haces el trabajo de venta.
            </span>
          </h2>

          <p className="text-xl text-slate-400 max-w-4xl mx-auto">
            Define tus reglas una vez y Kurukin responde igual de bien a la 1pm que a las 2am.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cards.map((card, index) => (
            <div
              key={index}
              className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <card.icon className="w-8 h-8 text-cyan-400" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">{card.title}</h3>
                <p className="text-slate-400 text-lg">{card.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-10 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Kurukin responde. Tú solo cierras.
            </h3>
            <p className="text-xl text-slate-300 mb-8">
              Pruébalo en vivo por WhatsApp y mira cómo atiende con estilo.
            </p>

            <a
              href={WHATSAPP_LINK}
              className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Ver Kurukin en Acción
            </a>

            <p className="text-slate-400 text-sm mt-3">Demostración en vivo. Sin registro.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
