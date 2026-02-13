import { Bot } from 'lucide-react';

const WHATSAPP_LINK = 'https://kurukin.com/contactar/chatear';

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <a href="#hero" className="flex items-center gap-2 flex-shrink-0">
            <Bot className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Kurukin</span>
          </a>

          {/* Links (desktop) */}
          <div className="hidden md:flex items-center gap-6 text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Cómo funciona
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Beneficios
            </a>
            <a href="#social-proof" className="hover:text-white transition-colors">
              Casos
            </a>
          </div>

          {/* CTA principal */}
          <a
            href={WHATSAPP_LINK}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Probar en WhatsApp
          </a>
        </div>
      </div>
    </nav>
  );
}
