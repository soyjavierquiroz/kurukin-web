import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_LINK = 'https://kurukin.com/contactar/chatear';

export function FloatingWhatsAppCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // aparece luego de cierto scroll (ajusta a gusto)
      setVisible(window.scrollY > 300);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={[
        'md:hidden fixed z-50 right-5 bottom-5 transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      ].join(' ')}
    >
      <a
        href={WHATSAPP_LINK}
        className="group inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-3 rounded-full font-bold shadow-2xl shadow-cyan-500/30 active:scale-95 transition-transform"
        aria-label="Probar Kurukin en WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
        <span>WhatsApp</span>
      </a>
    </div>
  );
}
