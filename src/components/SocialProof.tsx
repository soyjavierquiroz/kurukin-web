import { Quote, Star } from 'lucide-react';

export function SocialProof() {
  const testimonials = [
    {
      name: 'María González',
      role: 'CEO, TechStyle Boutique',
      content: 'Kurukin transformó completamente nuestra atención al cliente. Ahora cerramos ventas incluso cuando el equipo está fuera de línea. Increíble retorno de inversión.',
      rating: 5,
      image: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      name: 'Carlos Mendoza',
      role: 'Director, Fitness Pro',
      content: 'En solo 2 meses recuperamos la inversión. El agente de IA califica leads, agenda citas y resuelve dudas. Mi equipo ahora se enfoca en lo estratégico.',
      rating: 5,
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      name: 'Ana Rodríguez',
      role: 'Fundadora, Beauty & Wellness',
      content: 'La arquitectura digital que construyeron es impecable. Todo integrado, todo automatizado. Finalmente tengo tiempo para crecer mi negocio en lugar de apagar incendios.',
      rating: 5,
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Historias Reales,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Resultados Reales
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            La confianza de nuestros clientes es la base de nuestro éxito.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-2"
            >
              <div className="absolute top-6 right-6 text-cyan-500/20">
                <Quote className="w-12 h-12" />
              </div>

              <div className="relative">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>

                <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500/30"
                  />
                  <div>
                    <h4 className="text-white font-bold">{testimonial.name}</h4>
                    <p className="text-slate-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Únete a la élite que ya opera 24/7
          </h3>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                500+
              </div>
              <div className="text-slate-400">Negocios Automatizados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                10K+
              </div>
              <div className="text-slate-400">Ventas Cerradas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                98%
              </div>
              <div className="text-slate-400">Satisfacción</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-slate-400">Disponibilidad</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
