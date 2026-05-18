import { startTransition, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { getCountries, isValidPhoneNumber, type Country } from 'react-phone-number-input';
import SmartPhoneInput from './SmartPhoneInput';
import { useVisitor, type VisitorData } from '../context/VisitorContext';
import { getAnalyticsContext, trackQualifiedLead, trackSubmitForm } from '../lib/analytics';

const TOTAL_STEPS = 7;
const FALLBACK_COUNTRY: Country = 'US';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEBHOOK_URL = 'https://webhooks.kuruk.in/webhook/leadflow-eval';
const SITE_ID = 'KURUKIN';

const SUPPORTED_COUNTRIES = new Set<Country>(getCountries() as Country[]);

const PRIORITY_COUNTRIES = [
  'BO',
  'AR',
  'CL',
  'CO',
  'PE',
  'EC',
  'UY',
  'PY',
  'VE',
  'MX',
  'US',
  'ES',
] as const satisfies readonly Country[];

const OTHER_ALLOWED_COUNTRIES = [
  'CA',
  'CR',
  'PA',
  'DO',
  'GT',
  'HN',
  'SV',
  'NI',
  'PR',
  'GB',
  'DE',
  'FR',
  'IT',
  'PT',
  'NL',
  'CH',
  'SE',
  'JP',
  'CN',
  'KR',
  'IN',
  'AU',
  'NZ',
] as const satisfies readonly Country[];

const ALLOWED_COUNTRIES: Country[] = [...PRIORITY_COUNTRIES, ...OTHER_ALLOWED_COUNTRIES].filter((country) =>
  SUPPORTED_COUNTRIES.has(country as Country),
) as Country[];

const TEAM_SIZE_OPTIONS = [
  {
    value: 'less_than_15',
    label: 'Menos de 15 personas (Sigo haciendo todo el trabajo solo)',
  },
  {
    value: '15_to_50',
    label: 'Entre 15 y 50 personas (Tengo equipo, pero nos estancamos)',
  },
  {
    value: 'more_than_50',
    label: 'Más de 50 personas (Tengo líneas sólidas y líderes corriendo)',
  },
] as const;

const ACQUISITION_OPTIONS = [
  {
    value: 'no_survival',
    label: 'No. Dependemos 100% de perseguir amigos, familiares y mandar mensajes en frío',
  },
  {
    value: 'organic_hope',
    label: 'Dependemos de subir Reels y TikToks rezando para que el algoritmo nos traiga interesados',
  },
  {
    value: 'paid_no_system',
    label: 'Ya metemos publicidad pagada, pero mi equipo no sabe cómo cerrar prospectos en frío',
  },
] as const;

const INVESTMENT_OPTIONS = [
  {
    value: 'capital_ready',
    label: 'Tengo el dinero listo para pagarlo yo mismo si el sistema me convence en la llamada',
  },
  {
    value: 'team_pool',
    label: "Voy a armar una 'vaca' (co-inversión) con mis líderes clave para dividir el costo de las licencias",
  },
  {
    value: 'no_budget',
    label: 'No tenemos ese presupuesto en el equipo en este momento',
  },
] as const;

const DECISION_OPTIONS = [
  {
    value: 'yes',
    label: 'Depende 100% de mí. Yo decido qué herramientas usa mi organización',
  },
  {
    value: 'need_upline',
    label: 'Tengo que consultarlo con mi línea ascendente, socios o patrocinador',
  },
] as const;

type FinalStatus = 'calificado_llamada' | 'rechazado';
type AnalyticsPayloadContext = ReturnType<typeof getAnalyticsContext>;

interface Option {
  value: string;
  label: string;
}

interface Answers {
  teamSize: (typeof TEAM_SIZE_OPTIONS)[number]['value'] | '';
  companyProduct: string;
  mainProblem: string;
  acquisitionThermometer: (typeof ACQUISITION_OPTIONS)[number]['value'] | '';
  investmentPosition: (typeof INVESTMENT_OPTIONS)[number]['value'] | '';
  purchaseDecision: (typeof DECISION_OPTIONS)[number]['value'] | '';
  fullName: string;
  whatsapp: string;
  email: string;
  country: Country | '';
}

type AnswerKey = keyof Answers;
type FieldErrors = Partial<Record<AnswerKey, string>>;

export interface LeadflowPayload {
  email: string;
  telefono: string;
  nombre_completo: string;
  fbc: string | null;
  fbp: string | null;
  ttclid: string | null;
  ttc: string | null;
  analytics: AnalyticsPayloadContext;
  respuestas: {
    tamano_equipo: Option | null;
    compania_producto: string;
    principal_problema: string;
    inversion_ads: Option | null;
    posicion_frente_a_inversion: Option | null;
    decision_de_compra: Option | null;
    contacto: {
      nombre_completo: string;
      whatsapp: string;
      email: string;
      pais: {
        code: Country | '';
        label: string;
      };
    };
  };
  autoreject_triggered: boolean;
  final_status: FinalStatus;
}

interface LeadflowApplicationFormProps {
  className?: string;
  onPayloadReady?: (payload: LeadflowPayload) => Promise<void> | void;
}

interface LeadflowWebhookResponse {
  es_valido?: boolean;
  clasificacion?: string;
  classification?: string;
  ai_consulting_text?: string;
  message?: string;
}

interface OptionButtonProps {
  option: Option;
  selected: boolean;
  onClick: () => void;
}

const INITIAL_ANSWERS: Answers = {
  teamSize: '',
  companyProduct: '',
  mainProblem: '',
  acquisitionThermometer: '',
  investmentPosition: '',
  purchaseDecision: '',
  fullName: '',
  whatsapp: '',
  email: '',
  country: '',
};

function normalizeCountry(countryCode?: string): Country {
  if (!countryCode) return FALLBACK_COUNTRY;

  const normalized = countryCode.toUpperCase() as Country;
  return ALLOWED_COUNTRIES.includes(normalized) ? normalized : FALLBACK_COUNTRY;
}

function resolveCountryLabel(country: Country | ''): string {
  if (!country) return '';

  try {
    const displayNames = new Intl.DisplayNames(['es'], { type: 'region' });
    return displayNames.of(country) ?? country;
  } catch {
    return country;
  }
}

function getOption(options: readonly { value: string; label: string }[], value: string): Option | null {
  const match = options.find((option) => option.value === value);
  return match ? { value: match.value, label: match.label } : null;
}

function safeValidatePhone(value: string): boolean {
  if (!value.trim()) return false;

  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

function buildUserData(answers: Answers) {
  return {
    em: answers.email.trim().toLowerCase(),
    ph: answers.whatsapp.trim(),
    fn: answers.fullName.trim(),
  };
}

function buildPayload({
  answers,
  visitorData,
  analyticsContext,
}: {
  answers: Answers;
  visitorData: VisitorData | null;
  analyticsContext?: AnalyticsPayloadContext | null;
}): LeadflowPayload {
  const analytics = {
    ...(analyticsContext ?? getAnalyticsContext()),
    siteId: SITE_ID,
  };
  const selectedCountry = answers.country || normalizeCountry(visitorData?.country_code);
  const noBudget = answers.investmentPosition === 'no_budget';
  const email = answers.email.trim().toLowerCase();
  const telefono = answers.whatsapp.trim();
  const nombreCompleto = answers.fullName.trim();

  return {
    email,
    telefono,
    nombre_completo: nombreCompleto,
    fbc: analytics.fbc,
    fbp: analytics.fbp,
    ttclid: analytics.ttclid,
    ttc: analytics.ttclid,
    analytics,
    respuestas: {
      tamano_equipo: getOption(TEAM_SIZE_OPTIONS, answers.teamSize),
      compania_producto: answers.companyProduct.trim(),
      principal_problema: answers.mainProblem.trim(),
      inversion_ads: getOption(ACQUISITION_OPTIONS, answers.acquisitionThermometer),
      posicion_frente_a_inversion: getOption(INVESTMENT_OPTIONS, answers.investmentPosition),
      decision_de_compra: getOption(DECISION_OPTIONS, answers.purchaseDecision),
      contacto: {
        nombre_completo: nombreCompleto,
        whatsapp: telefono,
        email,
        pais: {
          code: selectedCountry,
          label: resolveCountryLabel(selectedCountry),
        },
      },
    },
    autoreject_triggered: noBudget,
    final_status: noBudget ? 'rechazado' : 'calificado_llamada',
  };
}

function validateStep(step: number, answers: Answers, isWhatsappValid: boolean): FieldErrors {
  const nextErrors: FieldErrors = {};

  switch (step) {
    case 1:
      if (!answers.teamSize) nextErrors.teamSize = 'Selecciona una opción para continuar.';
      break;
    case 2:
      if (!answers.companyProduct.trim()) nextErrors.companyProduct = 'Escribe la compañía donde estás corriendo.';
      break;
    case 3:
      if (!answers.mainProblem.trim()) nextErrors.mainProblem = 'Describe el freno principal de tu equipo.';
      break;
    case 4:
      if (!answers.acquisitionThermometer) nextErrors.acquisitionThermometer = 'Selecciona el escenario más cercano.';
      break;
    case 5:
      if (!answers.investmentPosition) nextErrors.investmentPosition = 'Selecciona cómo resolverán la inversión.';
      break;
    case 6:
      if (!answers.purchaseDecision) nextErrors.purchaseDecision = 'Selecciona quién toma la decisión.';
      break;
    case 7:
      if (!answers.fullName.trim()) nextErrors.fullName = 'Escribe tu nombre completo.';
      if (!answers.whatsapp.trim()) {
        nextErrors.whatsapp = 'Escribe tu WhatsApp.';
      } else if (!safeValidatePhone(answers.whatsapp) || !isWhatsappValid) {
        nextErrors.whatsapp = 'Ingresa un WhatsApp válido.';
      }
      if (!answers.email.trim()) {
        nextErrors.email = 'Escribe tu correo electrónico.';
      } else if (!EMAIL_REGEX.test(answers.email.trim())) {
        nextErrors.email = 'Ingresa un correo válido.';
      }
      if (!answers.country) nextErrors.country = 'Selecciona tu país.';
      break;
    default:
      break;
  }

  return nextErrors;
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-2 text-sm font-medium text-red-300">{message}</p>;
}

function OptionButton({ option, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition duration-200 sm:p-5',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70',
        selected
          ? 'border-cyan-300/80 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.16)]'
          : 'border-white/10 bg-white/[0.04] hover:border-cyan-300/60 hover:bg-white/[0.07]',
      ].join(' ')}
      aria-pressed={selected}
    >
      <span
        className={[
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition',
          selected ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-white/20 bg-slate-950 text-transparent',
        ].join(' ')}
        aria-hidden="true"
      >
        <CheckCircle2 className="h-4 w-4" />
      </span>
      <span className="text-lg font-semibold leading-snug text-white sm:text-xl">{option.label}</span>
    </button>
  );
}

function renderAIText(text: string | null) {
  if (!text) return null;

  return text.split('\n').map((paragraph, index) => {
    if (!paragraph.trim()) return null;

    return (
      <p key={index} className="text-base leading-relaxed text-slate-300 sm:text-lg">
        {paragraph.split('**').map((chunk, chunkIndex) =>
          chunkIndex % 2 === 1 ? (
            <span key={chunkIndex} className="font-bold text-white">
              {chunk}
            </span>
          ) : (
            chunk
          ),
        )}
      </p>
    );
  });
}

export function LeadflowApplicationForm({ className = '', onPayloadReady }: LeadflowApplicationFormProps) {
  const { visitorData, isLoading: isVisitorLoading } = useVisitor();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [selectedCountry, setSelectedCountry] = useState<Country>(FALLBACK_COUNTRY);
  const [isWhatsappValid, setIsWhatsappValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [lastPayload, setLastPayload] = useState<LeadflowPayload | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isQualified, setIsQualified] = useState(false);
  const hasManualCountrySelectionRef = useRef(false);
  const analyticsRef = useRef<AnalyticsPayloadContext | null>(null);

  useEffect(() => {
    analyticsRef.current = {
      ...getAnalyticsContext(),
      siteId: SITE_ID,
    };
  }, []);

  useEffect(() => {
    if (!visitorData?.country_code) return;
    if (hasManualCountrySelectionRef.current) return;

    const detectedCountry = normalizeCountry(visitorData.country_code);
    setSelectedCountry(detectedCountry);
    setAnswers((prev) => ({
      ...prev,
      country: detectedCountry,
    }));
  }, [visitorData?.country_code]);

  useEffect(() => {
    setAnswers((prev) => {
      if (prev.country === selectedCountry) return prev;
      return {
        ...prev,
        country: selectedCountry,
      };
    });
  }, [selectedCountry]);

  const progressPercentage = useMemo(() => {
    if (lastPayload) return 100;
    return Math.round((currentStep / TOTAL_STEPS) * 100);
  }, [currentStep, lastPayload]);

  const updateAnswer = <K extends AnswerKey,>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [key]: undefined,
    }));
    setSubmissionError('');
  };

  const selectAndAdvance = <K extends AnswerKey,>(key: K, value: Answers[K]) => {
    updateAnswer(key, value);
    startTransition(() => {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    });
  };

  const goToNextStep = () => {
    const stepErrors = validateStep(currentStep, answers, isWhatsappValid);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({
        ...prev,
        ...stepErrors,
      }));
      return;
    }

    startTransition(() => {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    });
  };

  const goToPreviousStep = () => {
    startTransition(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    });
  };

  const handleCountrySelection = (country: Country) => {
    hasManualCountrySelectionRef.current = true;
    setSelectedCountry(country);
    updateAnswer('country', country);
  };

  const handleFinalSubmission = async () => {
    const stepErrors = validateStep(7, answers, isWhatsappValid);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({
        ...prev,
        ...stepErrors,
      }));
      return;
    }

    const payload = buildPayload({
      answers: {
        ...answers,
        country: answers.country || selectedCountry,
      },
      visitorData,
      analyticsContext: analyticsRef.current,
    });
    const userData = buildUserData(answers);

    setIsSubmitting(true);
    setSubmissionError('');
    setAiResponse(null);
    setIsQualified(false);

    try {
      void trackSubmitForm(payload.analytics.eventId, userData).catch((error) => {
        console.error('[LeadflowApplicationForm] SubmitForm tracking failed', error);
      });

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Leadflow webhook failed with status ${response.status}`);
      }

      const evaluation = (await response.json()) as LeadflowWebhookResponse;
      const noBudget = payload.respuestas.posicion_frente_a_inversion?.value === 'no_budget';
      const approved = !noBudget && evaluation.es_valido === true;
      const classification = evaluation.clasificacion || evaluation.classification || 'Aprobado';
      const finalPayload: LeadflowPayload = {
        ...payload,
        autoreject_triggered: noBudget,
        final_status: approved ? 'calificado_llamada' : 'rechazado',
      };

      if (approved) {
        void trackQualifiedLead(payload.analytics.eventId, userData, classification).catch((error) => {
          console.error('[LeadflowApplicationForm] QualifiedLead tracking failed', error);
        });
      }

      try {
        await onPayloadReady?.(finalPayload);
      } catch (error) {
        console.error('[LeadflowApplicationForm] onPayloadReady failed', error);
      }

      setLastPayload(finalPayload);
      setIsQualified(approved);
      setAiResponse(
        typeof evaluation.ai_consulting_text === 'string' && evaluation.ai_consulting_text.trim().length > 0
          ? evaluation.ai_consulting_text.trim()
          : typeof evaluation.message === 'string' && evaluation.message.trim().length > 0
            ? evaluation.message.trim()
            : null,
      );
    } catch (error) {
      console.error('[LeadflowApplicationForm] submission failed', error);
      setSubmissionError('No pudimos procesar la auditoría en este momento. Inténtalo de nuevo en unos segundos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTextInput = ({
    id,
    label,
    value,
    placeholder,
    onChange,
    error,
    type = 'text',
  }: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    error?: string;
    type?: 'text' | 'email';
  }) => (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[
          'min-h-[64px] w-full rounded-xl border bg-white/[0.04] p-4 text-lg font-semibold text-white outline-none transition sm:p-5 sm:text-xl',
          'placeholder:text-slate-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20',
          error ? 'border-red-400' : 'border-white/10',
        ].join(' ')}
      />
      <InlineError message={error} />
    </div>
  );

  const renderTextarea = ({
    id,
    label,
    value,
    placeholder,
    onChange,
    error,
  }: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    error?: string;
  }) => (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={7}
        className={[
          'w-full rounded-xl border bg-white/[0.04] p-4 text-lg font-semibold leading-relaxed text-white outline-none transition sm:p-5 sm:text-xl',
          'placeholder:text-slate-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20',
          error ? 'border-red-400' : 'border-white/10',
        ].join(' ')}
      />
      <InlineError message={error} />
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex min-h-[560px] flex-col justify-center py-6 sm:min-h-[620px]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
              🔒 EXCLUSIVO PARA LÍDERES CON EQUIPOS ACTIVOS
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[0.95] text-white sm:text-6xl">
              Si tu equipo de MLM no prospecta sin ti... tienes un{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                autoempleo disfrazado.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300 sm:text-xl">
              LeadFlow despliega la infraestructura automatizada de adquisición para líderes que corren por rangos altos.
              No aceptamos curiosos, no financiamos a personas sin flujo de caja y solo abrimos 5 cupos por mes para
              desarrollo de sistemas. Si buscas un curso barato o trucos gratuitos, puedes cerrar esta pestaña.
            </p>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="mt-8 inline-flex min-h-[64px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 p-5 text-lg font-black uppercase text-white shadow-[0_0_34px_rgba(37,99,235,0.36)] transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>⚡ INICIAR MI AUDITORÍA DE EQUIPO</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        );
      case 1:
        return (
          <StepShell
            eyebrow="Pantalla 1"
            title="¿De qué tamaño es tu organización activa actualmente?"
            subtitle="Gente cobrando cheques y construyendo, no consumidores durmientes."
          >
            {TEAM_SIZE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                option={option}
                selected={answers.teamSize === option.value}
                onClick={() => selectAndAdvance('teamSize', option.value)}
              />
            ))}
            <InlineError message={errors.teamSize} />
          </StepShell>
        );
      case 2:
        return (
          <StepShell
            eyebrow="Pantalla 2"
            title="¿En qué compañía de MLM / Redes de Mercadeo estás corriendo tu negocio hoy?"
          >
            {renderTextInput({
              id: 'companyProduct',
              label: 'Compañía',
              value: answers.companyProduct,
              placeholder: 'Ej: Herbalife, Amway, Jeunesse...',
              onChange: (value) => updateAnswer('companyProduct', value),
              error: errors.companyProduct,
            })}
          </StepShell>
        );
      case 3:
        return (
          <StepShell
            eyebrow="Pantalla 3"
            title="Sé brutalmente honesto: ¿Cuál es el freno número uno en tu equipo por el cual tu gente no duplica y tu cheque se estancó?"
          >
            {renderTextarea({
              id: 'mainProblem',
              label: 'Diagnóstico',
              value: answers.mainProblem,
              placeholder:
                '¿Tu gente se raja a los 30 días? ¿Se quedaron sin lista de contactos? ¿Dependen de que tú les des las presentaciones para poder cerrar?...',
              onChange: (value) => updateAnswer('mainProblem', value),
              error: errors.mainProblem,
            })}
          </StepShell>
        );
      case 4:
        return (
          <StepShell
            eyebrow="Pantalla 4"
            title="Si hoy mismo te apagamos tu lista de contactos conocidos y tus redes sociales personales... ¿Tu red sigue registrando gente mañana?"
          >
            {ACQUISITION_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                option={option}
                selected={answers.acquisitionThermometer === option.value}
                onClick={() => selectAndAdvance('acquisitionThermometer', option.value)}
              />
            ))}
            <InlineError message={errors.acquisitionThermometer} />
          </StepShell>
        );
      case 5:
        return (
          <StepShell
            eyebrow="Pantalla 5"
            title="El sistema LeadFlow se monta en bloque para tu equipo y la inversión va desde los $1,500 hasta los $3,000 USD anuales. Al ser una herramienta grupal, el costo se puede dividir. ¿Cómo lo vas a pagar?"
          >
            {INVESTMENT_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                option={option}
                selected={answers.investmentPosition === option.value}
                onClick={() => selectAndAdvance('investmentPosition', option.value)}
              />
            ))}
            <InlineError message={errors.investmentPosition} />
          </StepShell>
        );
      case 6:
        return (
          <StepShell
            eyebrow="Pantalla 6"
            title="Si vemos que tu equipo califica para el sistema... ¿La decisión de compra depende 100% de ti o tienes que pedirle permiso a tu Upline o rango superior?"
          >
            {DECISION_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                option={option}
                selected={answers.purchaseDecision === option.value}
                onClick={() => selectAndAdvance('purchaseDecision', option.value)}
              />
            ))}
            <InlineError message={errors.purchaseDecision} />
          </StepShell>
        );
      case 7:
        return (
          <StepShell
            eyebrow="Pantalla 7"
            title="Déjanos tus datos reales para agendar la llamada de diagnóstico."
            subtitle="Si los datos de contacto son falsos, el sistema de IA anulará la aplicación de inmediato."
          >
            <div className="space-y-5">
              {renderTextInput({
                id: 'fullName',
                label: 'Nombre completo',
                value: answers.fullName,
                placeholder: 'Nombre y apellido reales',
                onChange: (value) => updateAnswer('fullName', value),
                error: errors.fullName,
              })}

              <SmartPhoneInput
                key={answers.country || selectedCountry}
                id="leadflow-whatsapp"
                name="whatsapp"
                label="WhatsApp"
                value={answers.whatsapp}
                onChange={(value) => updateAnswer('whatsapp', value)}
                onValidityChange={setIsWhatsappValid}
                onCountryChange={handleCountrySelection}
                error={errors.whatsapp}
                required
                defaultCountry={answers.country || selectedCountry || FALLBACK_COUNTRY}
                autoDetectCountry={false}
                placeholder="Tu número con prefijo"
                theme="dark"
                className={[
                  'text-lg',
                  '[&_.PhoneInputCountry]:!h-16 [&_.PhoneInputCountry]:!min-w-[118px] [&_.PhoneInputCountry]:!px-4',
                  '[&_.PhoneInputInput]:!h-16 [&_.PhoneInputInput]:!px-5 [&_.PhoneInputInput]:!text-lg [&_.PhoneInputInput]:!font-semibold',
                  '[&_.SmartPhoneCallingCode]:!text-lg',
                ].join(' ')}
              />

              {renderTextInput({
                id: 'email',
                label: 'Correo electrónico',
                value: answers.email,
                placeholder: 'tu@email.com',
                onChange: (value) => updateAnswer('email', value),
                error: errors.email,
                type: 'email',
              })}

              {isVisitorLoading ? <p className="text-sm text-slate-500">Detectando país por IP...</p> : null}

              {submissionError ? (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                  {submissionError}
                </div>
              ) : null}
            </div>
          </StepShell>
        );
      default:
        return null;
    }
  };

  const shouldShowResult = Boolean(lastPayload);
  const shouldShowFooter = !shouldShowResult && currentStep > 0;
  const isFinalStep = currentStep === TOTAL_STEPS;
  const isChoiceStep = [1, 4, 5, 6].includes(currentStep);
  const shouldShowContinue = !isChoiceStep && !isFinalStep;
  const waNumber = (import.meta.env.VITE_LEADFLOW_WHATSAPP_NUMBER || import.meta.env.VITE_WHATSAPP_NUMBER || '59179790873').replace(
    /\D/g,
    '',
  );
  const calendarUrl = import.meta.env.VITE_LEADFLOW_CALENDAR_URL || 'https://kurukin.com/contactar/agendar';
  const whatsappScheduleMessage = encodeURIComponent(
    'Hola, acabo de completar mi auditoría de LeadFlow y el sistema me aprobó para agendar diagnóstico.',
  );
  const whatsappScheduleUrl = `https://wa.me/${waNumber}?text=${whatsappScheduleMessage}`;
  const resultText = isQualified
    ? 'Tu aplicación pasó el filtro inicial. El siguiente paso es revisar si tu estructura puede absorber LeadFlow sin que tú sigas cargando toda la prospección.'
    : 'Gracias por completar la auditoría. Registramos tus respuestas correctamente. En este momento no habilitaremos agenda directa para tu aplicación.';

  return (
    <section
      className={[
        'relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white',
        'sm:rounded-2xl sm:border sm:border-white/10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="shrink-0 border-b border-white/10 bg-black px-4 py-3 sm:px-6">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <span>{shouldShowResult ? 'Resultado' : currentStep === 0 ? 'Auditoría LeadFlow' : `Paso ${currentStep} / ${TOTAL_STEPS}`}</span>
          <span>{progressPercentage}%</span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#020617_0%,#000_100%)] px-4 py-5 sm:px-6 sm:py-8">
        {shouldShowResult && lastPayload ? (
          <div className="flex min-h-[520px] flex-col justify-center py-6">
            <div
              className={[
                'flex h-14 w-14 items-center justify-center rounded-xl border',
                isQualified ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200' : 'border-slate-600 bg-white/[0.04] text-slate-300',
              ].join(' ')}
            >
              {isQualified ? <ShieldCheck className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
            </div>

            <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              {isQualified ? 'Acceso habilitado' : 'Auditoría recibida'}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
              {isQualified ? 'Tu equipo puede pasar a diagnóstico.' : 'Gracias. El sistema registró tu aplicación.'}
            </h2>
            <div className="mt-5 space-y-4">{renderAIText(aiResponse) || renderAIText(resultText)}</div>

            {isQualified ? (
              <div className="mt-8 rounded-xl border border-cyan-300/20 bg-white/[0.04] p-4 sm:p-5">
                <div className="flex items-center gap-3 text-cyan-200">
                  <CalendarDays className="h-5 w-5" />
                  <h3 className="text-lg font-black uppercase tracking-[0.12em]">Agenda del closer</h3>
                </div>
                <p className="mt-3 text-base leading-relaxed text-slate-300">
                  Abre la conversación de agenda y envía el mensaje prellenado. Si tu teléfono y correo no coinciden con
                  la auditoría, se cancela el acceso.
                </p>
                <iframe
                  title="Calendario de diagnóstico LeadFlow"
                  src={calendarUrl}
                  className="mt-5 h-[520px] w-full rounded-lg border border-white/10 bg-black"
                  loading="lazy"
                />
                <a
                  href={whatsappScheduleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex min-h-[60px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 p-4 text-lg font-black uppercase text-white shadow-[0_0_30px_rgba(37,99,235,0.35)] transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  Agendar diagnóstico
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            ) : null}

            {import.meta.env.DEV ? (
              <details className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-300">Payload de desarrollo</summary>
                <pre className="mt-4 max-h-80 overflow-auto text-xs leading-relaxed text-slate-400">
                  {JSON.stringify(lastPayload, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ) : (
          renderStepContent()
        )}
      </div>

      {shouldShowFooter ? (
        <footer className="shrink-0 border-t border-white/10 bg-black p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold uppercase text-slate-300 transition hover:border-white/25 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </button>

            {shouldShowContinue ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black uppercase text-slate-950 transition hover:bg-cyan-100 sm:flex-none"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            {isFinalStep ? (
              <button
                type="button"
                onClick={() => void handleFinalSubmission()}
                disabled={isSubmitting}
                className="inline-flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 text-sm font-black uppercase text-white transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando
                  </>
                ) : (
                  <>
                    🚀 ENVIAR AUDITORÍA Y SOLICITAR ACCESO
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        </footer>
      ) : null}
    </section>
  );
}

function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[520px] flex-col justify-center py-6">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-lg leading-relaxed text-slate-300 sm:text-xl">{subtitle}</p> : null}
      <div className="mt-8 space-y-4">{children}</div>
    </div>
  );
}

export default LeadflowApplicationForm;
