import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-slate-900 to-slate-950"></div>

      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-8">
          <Zap className="w-4 h-4 text-red-400" />
          <span className="text-red-300 text-sm font-medium">Tiempo Limitado</span>
        </div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          El Futuro No Espera.
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ¿Y Tu Negocio?
          </span>
        </h2>

        <p className="text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
          Da el primer paso hacia una operación más inteligente, rentable y libre.
          <span className="block mt-2 text-cyan-400 font-semibold">
            No te quedes atrás en la era de la IA.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <button className="group bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-12 py-5 rounded-lg font-bold text-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3">
            ¡Quiero mi Diagnóstico Gratuito Ahora!
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
          <button className="text-white border-2 border-slate-700 hover:border-cyan-500 px-12 py-5 rounded-lg font-semibold text-xl transition-all duration-300 hover:bg-cyan-500/10">
            Ver Casos de Éxito
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-white font-bold mb-2">Implementación Rápida</h3>
            <p className="text-slate-400">Tu agente operativo en días, no meses</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-bold mb-2">Garantía de Resultados</h3>
            <p className="text-slate-400">ROI comprobado o tu dinero de vuelta</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-white font-bold mb-2">Soporte Premium</h3>
            <p className="text-slate-400">Acompañamiento continuo y mejoras</p>
          </div>
        </div>

        <p className="text-slate-500 text-sm">
          Deja de ser un esclavo de tu operación y conviértete en el estratega.
        </p>
      </div>

      <footer className="relative mt-24 pt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-400 text-sm">
            © 2026 Kurukin. Todos los derechos reservados.
          </div>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-cyan-400 transition-colors">Términos</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </section>
  );
}
