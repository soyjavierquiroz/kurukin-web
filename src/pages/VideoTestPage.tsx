import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { KurukinPlayer } from '../components/kurukin-video-player/KurukinPlayer';
import { PricingCard } from '../components/PricingCard';
import { SmartPhoneInput } from '../components/SmartPhoneInput';
import { SmartLinkManager } from '../components/SmartLinkManager';
import { useVisitor } from '../context/VisitorContext';
import { useHotmartPrices } from '../hooks/useHotmartPrices';
import { getFriendlyCurrencyName } from '../utils/currency';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  whatsapp?: string;
}

interface VideoLeadPayload {
  lead: {
    nombre: string;
    apellido: string;
    email: string;
    whatsapp: string;
  };
  meta: {
    ip?: string;
    ciudad?: string;
    pais?: string;
    zona_horaria?: string;
    moneda?: string;
  };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const VideoTestPage = () => {
  const { visitorData, isLoading } = useVisitor();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isWhatsappValid, setIsWhatsappValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [lastPayload, setLastPayload] = useState<VideoLeadPayload | null>(null);
  const { scrapedData } = useHotmartPrices('Y43592026T');

  const clickFunnelsButtonImage = '/assets/images/activar-sonido.png';

  const dynamicHeadline = useMemo(() => {
    if (!isLoading && visitorData?.city && visitorData?.currency) {
      const friendlyCurrency = getFriendlyCurrencyName(visitorData.currency);
      return `También puedes participar desde ${visitorData.city} y pagar en ${friendlyCurrency}`;
    }

    return 'También puedes participar desde tu ciudad';
  }, [isLoading, visitorData?.city, visitorData?.currency]);

  const canSubmit = useMemo(() => {
    return (
      !isSubmitting &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      isValidEmail(email.trim()) &&
      whatsapp.trim().length > 0 &&
      isWhatsappValid
    );
  }, [email, firstName, isSubmitting, isWhatsappValid, lastName, whatsapp]);

  const handleInputChange = (
    setter: (value: string) => void,
    field: keyof FormErrors,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setter(event.target.value);
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!firstName.trim()) {
      nextErrors.firstName = 'Completa este campo.';
    }

    if (!lastName.trim()) {
      nextErrors.lastName = 'Completa este campo.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Por favor, ingresa tu email.';
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Ingresa un email valido.';
    }

    if (!whatsapp.trim()) {
      nextErrors.whatsapp = 'Por favor, ingresa tu WhatsApp.';
    } else if (!isWhatsappValid) {
      nextErrors.whatsapp = 'Ingresa un numero de WhatsApp valido en formato internacional.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const payload: VideoLeadPayload = {
      lead: {
        nombre: firstName.trim(),
        apellido: lastName.trim(),
        email: email.trim(),
        whatsapp: whatsapp,
      },
      meta: {
        ip: visitorData?.ip,
        ciudad: visitorData?.city,
        pais: visitorData?.country_name,
        zona_horaria: visitorData?.timezone,
        moneda: visitorData?.currency,
      },
    };

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 700);
      });

      console.log(payload);
      setLastPayload(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] py-10 px-4 font-sans text-slate-100">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Laboratorio: Kurukin Player <span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-400">Prueba de video inteligente + formulario enriquecido con contexto global.</p>
        </div>

        <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-[0_0_50px_rgba(59,130,246,0.1)]">
          <KurukinPlayer
            provider="youtube"
            videoId="bTqVqk7FSmY"
            lazyLoadYoutube
            hideYoutubeUi
            mutedPreview={{
              enabled: true,
              overlayImageUrl: clickFunnelsButtonImage,
              overlayPosition: 'top-left',
            }}
            callToAction={{
              enabled: true,
              displayAtSeconds: 15,
              headline: 'Aumenta tus ventas con Kurukin hoy',
              buttonText: 'Probar Kurukin en WhatsApp',
              buttonUrl: 'https://kurukin.com',
            }}
          />
        </div>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl backdrop-blur md:p-7">
          <h2 className="text-xl md:text-2xl font-bold text-cyan-300">{dynamicHeadline}</h2>

          <form className="mt-5 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="video-first-name" className="mb-2 block text-sm font-medium text-slate-200">
                  Nombre
                </label>
                <input
                  id="video-first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) => handleInputChange(setFirstName, 'firstName', event)}
                  className={[
                    'h-11 w-full rounded-md border bg-slate-950 px-4 text-base text-slate-100',
                    'placeholder:text-slate-500 focus:outline-none focus:ring-2',
                    errors.firstName
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-500/30',
                  ].join(' ')}
                  placeholder="Tu nombre"
                />
                {errors.firstName ? <p className="mt-2 text-xs text-red-400">{errors.firstName}</p> : null}
              </div>

              <div>
                <label htmlFor="video-last-name" className="mb-2 block text-sm font-medium text-slate-200">
                  Apellido
                </label>
                <input
                  id="video-last-name"
                  type="text"
                  value={lastName}
                  onChange={(event) => handleInputChange(setLastName, 'lastName', event)}
                  className={[
                    'h-11 w-full rounded-md border bg-slate-950 px-4 text-base text-slate-100',
                    'placeholder:text-slate-500 focus:outline-none focus:ring-2',
                    errors.lastName
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-500/30',
                  ].join(' ')}
                  placeholder="Tu apellido"
                />
                {errors.lastName ? <p className="mt-2 text-xs text-red-400">{errors.lastName}</p> : null}
              </div>
            </div>

            <div>
              <label htmlFor="video-email" className="mb-2 block text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                id="video-email"
                type="email"
                value={email}
                onChange={(event) => handleInputChange(setEmail, 'email', event)}
                className={[
                  'h-11 w-full rounded-md border bg-slate-950 px-4 text-base text-slate-100',
                  'placeholder:text-slate-500 focus:outline-none focus:ring-2',
                  errors.email
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
                    : 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-500/30',
                ].join(' ')}
                placeholder="tu@email.com"
              />
              {errors.email ? <p className="mt-2 text-xs text-red-400">{errors.email}</p> : null}
            </div>

            <SmartPhoneInput
              id="video-whatsapp"
              name="whatsapp"
              label="WhatsApp"
              value={whatsapp}
              onChange={(nextValue) => {
                setWhatsapp(nextValue);
                setErrors((prev) => ({ ...prev, whatsapp: undefined }));
              }}
              onValidityChange={setIsWhatsappValid}
              error={errors.whatsapp}
              required
              defaultCountry="BO"
              autoDetectCountry
              placeholder="79790873"
            />

            <input type="hidden" name="visitor_ip" value={visitorData?.ip || ''} />
            <input type="hidden" name="visitor_city" value={visitorData?.city || ''} />
            <input type="hidden" name="visitor_country_name" value={visitorData?.country_name || ''} />
            <input type="hidden" name="visitor_timezone" value={visitorData?.timezone || ''} />
            <input type="hidden" name="visitor_currency" value={visitorData?.currency || ''} />

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {isSubmitting ? 'Enviando...' : 'Validar y Enviar'}
            </button>
          </form>

          {lastPayload ? (
            <section className="mt-6 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-300">Payload de webhook (debug)</p>
              <pre className="mt-2 overflow-x-auto text-xs text-emerald-100">{JSON.stringify(lastPayload, null, 2)}</pre>
            </section>
          ) : null}
        </section>

        <PricingCard
          productName="Kurukin"
          basePriceUSD={497}
          checkoutUrl="https://pay.hotmart.com/Y43592026T"
          scrapedData={scrapedData}
        />

        <div className="mt-12">
          <SmartLinkManager />
        </div>
      </div>
    </div>
  );
};
