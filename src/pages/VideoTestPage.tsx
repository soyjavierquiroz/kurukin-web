import React from 'react';
import { KurukinPlayer } from '../components/kurukin-video-player';

export const VideoTestPage = () => {
  // ¡LA URL CORRECTA DE TU IMAGEN!
  const clickFunnelsButtonImage = "/assets/images/activar-sonido.png";

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center py-12 px-4 font-sans text-slate-100">
      
      <div className="max-w-4xl w-full space-y-8">
        
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4">
            Laboratorio: Kurukin Player <span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-400">
            Prueba de imagen personalizada con POSICIONAMIENTO.
          </p>
        </div>

        <div className="w-full shadow-[0_0_50px_rgba(59,130,246,0.1)] rounded-2xl overflow-hidden border border-slate-800 bg-black">
          
          <KurukinPlayer 
            provider="youtube" 
            videoId="bTqVqk7FSmY" 
            lazyLoadYoutube={true} 
            hideYoutubeUi={true}
            mutedPreview={{
              enabled: true,
              overlayImageUrl: clickFunnelsButtonImage,
              // ¡NUEVA CONFIGURACIÓN! PRUEBA CAMBIAR ESTO:
              // 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
              overlayPosition: 'top-left' 
            }}
            callToAction={{
              enabled: true,
              displayAtSeconds: 15,
              headline: "¡Aumenta tus ventas con Kurukin hoy!",
              buttonText: "Probar Kurukin en WhatsApp",
              buttonUrl: "https://kurukin.com"
            }}
          />

        </div>
      </div>
    </div>
  );
};