import { ShieldCheck } from 'lucide-react';

export default function DownsellPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-black text-white py-12 sm:py-20 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_40%)]" />

      <main className="relative mx-auto max-w-3xl">
        {/* Cabecera / Reframing */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-full mb-6">
            <ShieldCheck className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight text-white mb-4">
            <span className="text-red-500">🛑 RESULTADO DE TU DIAGNÓSTICO:</span><br />
            Acceso a Consultoría Privada PAUSADO
          </h1>
          <p className="text-lg md:text-xl font-medium text-slate-400">
            (Lee esto con atención)
          </p>
        </div>

        {/* Carta de Ventas - Panel de Cristal */}
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-6 md:p-12 shadow-2xl backdrop-blur-md space-y-6 text-lg leading-relaxed text-slate-300">
          <p>
            Hola. Basado en las respuestas que nuestra Inteligencia Artificial acaba de evaluar, hemos decidido <strong className="text-white">no habilitar tu acceso</strong> a nuestra implementación privada 1-a-1.
          </p>
          <p>
            Pero no te preocupes, esto no es algo malo. <strong className="text-amber-400">Es para proteger tu bolsillo.</strong>
          </p>
          <p>
            Nuestra consultoría premium (de $3,000+ USD) está diseñada para líderes que ya tienen redes enormes y necesitan automatizar a escala masiva. Venderte ese sistema a ti en esta etapa de tu negocio sería como venderte un cohete de la NASA para ir a la esquina. Sería un desperdicio de tu dinero, y nosotros no operamos así.
          </p>

          <div className="h-px w-full bg-white/10 my-8" />

          <h2 className="text-2xl font-bold text-white">Tienes algo que el 90% no tiene</h2>
          <p>
            Dicho esto, tienes algo que el 90% de los networkers allá afuera no tienen: <strong className="text-white">Tomaste acción.</strong>
          </p>
          <p>
            Entiendes perfectamente que perseguir a tu familia, mandar mensajes en frío y rogar por atención en redes sociales ya no funciona. Tienes la mentalidad correcta, solo te falta la infraestructura.
          </p>
          <p>
            No vamos a dejarte con las manos vacías para que vuelvas a hacer listas de contactos. Para líderes con iniciativa como tú, hemos habilitado una <strong className="text-white">"Puerta Trasera" a nuestra tecnología: El Motor de Prospección Agnóstico (Versión Hazlo-Tú-Mismo).</strong>
          </p>
          <p>
            En lugar de cobrarte miles de dólares por instalártelo nosotros, te damos los planos exactos, las páginas y el Bot de WhatsApp para que lo uses en tu propia red hoy mismo, sin importar en qué compañía estés.
          </p>

          <div className="rounded-2xl bg-black/50 p-6 border border-zinc-800 my-8">
            <p className="text-center font-bold text-white text-xl mb-2">No cuesta miles.</p>
            <p className="text-center text-slate-300">
              Solo cuesta <strong className="text-amber-400 text-2xl">$30 USD</strong> por un acceso completo de 90 Días (Apenas $10 al mes).
            </p>
          </div>

          <p>
            ¿Por qué 90 días? Porque es el tiempo exacto que necesitas para aplicar un plan de acción real en multinivel, subir de rango y empezar a facturar de verdad.
          </p>
          <p className="font-bold text-white">
            Este es nuestro trato: Entra hoy por $30. Usa nuestro sistema. Deja de rogarle a la gente. Construye tu equipo de 15 a 50 personas. Y cuando tengas el volumen y el cheque que mereces... vuelves a llenar nuestro formulario, aplicas al programa VIP y escalamos juntos.
          </p>
          <p className="text-center font-bold text-xl text-white pt-4">
            Tu nueva etapa empieza aquí.
          </p>

          <div className="pt-6">
            {/* Reemplaza '#' por tu link de pago real de Hotmart/Stripe */}
            <a
              href="#"
              className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-8 py-5 text-center font-bold uppercase text-white shadow-[0_16px_32px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-lg md:text-xl tracking-tight">Quiero mis 90 días de acceso por $30 USD ahora</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
