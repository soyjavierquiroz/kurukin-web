import { ShieldAlert, Zap, Bot, LayoutTemplate, CheckCircle2 } from 'lucide-react';

export default function DownsellPage() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 selection:bg-amber-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.02),transparent_50%)] pointer-events-none" />

      <main className="relative mx-auto max-w-3xl">
        {/* CABECERA DE ALERTA */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-2xl mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
            <span className="text-red-500">Diagnóstico:</span><br />
            Acceso VIP Pausado
          </h1>
          <p className="text-lg text-slate-400 font-medium tracking-wide">(Lee esto con atención antes de cerrar)</p>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10 shadow-2xl relative overflow-hidden">

          {/* EL DIAGNÓSTICO CRUDO */}
          <div className="space-y-4 text-lg text-slate-300 leading-relaxed mb-10">
            <p>
              Basado en el análisis de tu perfil, <strong className="text-white">hemos bloqueado tu acceso</strong> a nuestra implementación privada 1-a-1.
            </p>
            <div className="border-l-4 border-amber-500 pl-4 bg-amber-500/5 p-4 rounded-r-lg">
              <p className="text-amber-400 font-bold mb-1">Es para proteger tu bolsillo.</p>
              <p className="text-sm md:text-base text-slate-300">
                Venderte un sistema corporativo de $3,000+ USD en tu etapa actual sería como venderte un cohete para ir a la esquina. Sería un robo, y nosotros no operamos así.
              </p>
            </div>
            <p>
              Sin embargo, tienes la mentalidad correcta. Entiendes que <strong className="text-white">perseguir amigos y rogar en redes sociales ya no funciona.</strong> Solo te falta la infraestructura.
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-10" />

          {/* LA OFERTA - ESCANEABLE */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Tu "Puerta Trasera" a la tecnología LeadFlow
            </h2>
            <p className="text-center text-slate-400 mb-8">
              Te entregamos el Motor de Prospección (Versión DIY) para que lo instales hoy mismo en tu red.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
                <LayoutTemplate className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-white text-sm mb-1">Embudos de Captura</h3>
                <p className="text-xs text-slate-400">Páginas exactas para filtrar prospectos.</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
                <Bot className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-white text-sm mb-1">Bot de WhatsApp</h3>
                <p className="text-xs text-slate-400">Automatización de seguimiento 24/7.</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
                <Zap className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-white text-sm mb-1">Planos de Acción</h3>
                <p className="text-xs text-slate-400">Instrucciones tácticas paso a paso.</p>
              </div>
            </div>
          </div>

          {/* CAJA DE PRECIO PREMIUM */}
          <div className="relative rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-8 text-center mb-8 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest py-1 px-4 rounded-b-lg">
              Oferta Única
            </div>
            <p className="text-slate-300 font-medium mb-2 mt-2">Acceso completo por 90 Días</p>
            <div className="flex justify-center items-end gap-2 mb-4">
              <span className="text-5xl font-black text-white">$30</span>
              <span className="text-emerald-400 font-bold mb-1">USD</span>
            </div>

            <ul className="text-sm text-slate-300 space-y-2 flex flex-col items-center mb-8">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cero cuotas mensuales ocultas</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Escala de 15 a 50 personas</li>
            </ul>

            <a
              href={import.meta.env.VITE_LEADFLOW_DOWNSELL_URL || '#'}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 p-4 font-bold uppercase text-black transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-95"
            >
              <span className="text-lg md:text-xl tracking-tight">Sí, quiero la infraestructura</span>
            </a>
          </div>

          <p className="text-center text-sm text-slate-500">
            Sube de rango, factura y luego vuelve a aplicar al programa VIP.
          </p>

        </div>
      </main>
    </div>
  );
}
