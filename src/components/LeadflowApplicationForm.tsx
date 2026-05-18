import { startTransition, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { getCountries, isValidPhoneNumber, type Country } from 'react-phone-number-input';
import SmartPhoneInput from './SmartPhoneInput';
import { useVisitor, type VisitorData } from '../context/VisitorContext';
import { getAnalyticsContext, trackQualifiedLead, trackSubmitForm } from '../lib/analytics';

const TOTAL_STEPS = 7;
const SUCCESS_COUNTDOWN_SECONDS = 20;
const EVALUATION_MIN_DURATION_MS = 5000;
const MIN_COMPANY_TEXT_LENGTH = 4;
const MIN_DETAILED_TEXT_LENGTH = 15;
const MIN_DETAILED_TEXT_WORDS = 3;
const DETAILED_TEXT_WARNING = 'Por favor, introduce una respuesta detallada (mínimo 3 palabras) para procesar tu viabilidad.';
const COMPANY_TEXT_WARNING = 'Escribe al menos 4 caracteres para identificar tu compañía o producto.';
const FALLBACK_COUNTRY: Country = 'US';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEBHOOK_URL = 'https://webhooks.kuruk.in/webhook/leadflow-eval';
const SITE_ID = 'KURUKIN';
const WHATSAPP_SUCCESS_MESSAGE =
  'Hola Javier, acabo de completar el diagnóstico de viabilidad para mi equipo y obtuve Luz Verde. Quiero coordinar los detalles de la infraestructura.';
const WHATSAPP_SUCCESS_URL = `https://api.whatsapp.com/send?phone=59179790873&text=${encodeURIComponent(
  WHATSAPP_SUCCESS_MESSAGE,
)}`;
const EVALUATION_MESSAGES = [
  '🤖 Inicializando motor de evaluación de estructuras...',
  '📊 Analizando métricas de duplicación y retención...',
  '⚙️ Verificando viabilidad de infraestructura financiera...',
  '🔒 Generando diagnóstico final de escala...',
] as const;

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
type RadioAnswerKey = 'teamSize' | 'acquisitionThermometer' | 'investmentPosition' | 'purchaseDecision';

interface Option {
  value: string;
  label: string;
}

interface Answers {
  teamSize: Option | null;
  companyProduct: string;
  mainProblem: string;
  acquisitionThermometer: Option | null;
  investmentPosition: Option | null;
  purchaseDecision: Option | null;
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
  handleSelectOption: (option: Option) => void;
}

const INITIAL_ANSWERS: Answers = {
  teamSize: null,
  companyProduct: '',
  mainProblem: '',
  acquisitionThermometer: null,
  investmentPosition: null,
  purchaseDecision: null,
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

function safeValidatePhone(value: string): boolean {
  if (!value.trim()) return false;

  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

function isDetailedText(value: string): boolean {
  const normalized = value.trim();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  return normalized.length >= MIN_DETAILED_TEXT_LENGTH && wordCount >= MIN_DETAILED_TEXT_WORDS;
}

function isValidCompanyText(value: string): boolean {
  return value.trim().length >= MIN_COMPANY_TEXT_LENGTH;
}

function getCurrentStepKey(step: number): RadioAnswerKey | null {
  switch (step) {
    case 1:
      return 'teamSize';
    case 4:
      return 'acquisitionThermometer';
    case 5:
      return 'investmentPosition';
    case 6:
      return 'purchaseDecision';
    default:
      return null;
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
  const noBudget = answers.investmentPosition?.value === 'no_budget';
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
      tamano_equipo: answers.teamSize,
      compania_producto: answers.companyProduct.trim(),
      principal_problema: answers.mainProblem.trim(),
      inversion_ads: answers.acquisitionThermometer,
      posicion_frente_a_inversion: answers.investmentPosition,
      decision_de_compra: answers.purchaseDecision,
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
      if (!answers.companyProduct.trim()) {
        nextErrors.companyProduct = 'Escribe la compañía donde estás corriendo.';
      } else if (!isValidCompanyText(answers.companyProduct)) {
        nextErrors.companyProduct = COMPANY_TEXT_WARNING;
      }
      break;
    case 3:
      if (!answers.mainProblem.trim()) {
        nextErrors.mainProblem = 'Describe el freno principal de tu equipo.';
      } else if (!isDetailedText(answers.mainProblem)) {
        nextErrors.mainProblem = DETAILED_TEXT_WARNING;
      }
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

function OptionButton({ option, selected, handleSelectOption }: OptionButtonProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => handleSelectOption(option)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        handleSelectOption(option);
      }}
      className={[
        'group flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition duration-200 md:p-4',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70',
        selected
          ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500 shadow-[0_0_28px_rgba(34,211,238,0.16)]'
          : 'border-white/10 bg-slate-900/40 hover:border-cyan-300/60 hover:bg-white/[0.07]',
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
      <span className="text-base font-semibold leading-snug text-white md:text-lg">{option.label}</span>
    </div>
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
  const [respuestas, setRespuestas] = useState<Answers>(INITIAL_ANSWERS);
  const answers = respuestas;
  const [errors, setErrors] = useState<FieldErrors>({});
  const [selectedCountry, setSelectedCountry] = useState<Country>(FALLBACK_COUNTRY);
  const [isWhatsappValid, setIsWhatsappValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationMessageIndex, setEvaluationMessageIndex] = useState(0);
  const [submissionError, setSubmissionError] = useState('');
  const [lastPayload, setLastPayload] = useState<LeadflowPayload | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isQualified, setIsQualified] = useState(false);
  const [countdown, setCountdown] = useState(SUCCESS_COUNTDOWN_SECONDS);
  const hasManualCountrySelectionRef = useRef(false);
  const analyticsRef = useRef<AnalyticsPayloadContext | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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
    setRespuestas((prev) => ({
      ...prev,
      country: detectedCountry,
    }));
  }, [visitorData?.country_code]);

  useEffect(() => {
    setRespuestas((prev) => {
      if (prev.country === selectedCountry) return prev;
      return {
        ...prev,
        country: selectedCountry,
      };
    });
  }, [selectedCountry]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  useEffect(() => {
    if (!lastPayload) return;

    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [lastPayload]);

  useEffect(() => {
    if (!isEvaluating) return;

    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isEvaluating]);

  useEffect(() => {
    setCountdown(SUCCESS_COUNTDOWN_SECONDS);
  }, [isQualified, lastPayload]);

  const successState = Boolean(lastPayload && isQualified);

  useEffect(() => {
    if (!successState) return;

    if (countdown === 0) {
      window.location.href = `https://api.whatsapp.com/send?phone=59179790873&text=${encodeURIComponent(
        WHATSAPP_SUCCESS_MESSAGE,
      )}`;
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [countdown, lastPayload, successState]);

  useEffect(() => {
    if (!isEvaluating) {
      setEvaluationMessageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setEvaluationMessageIndex((prev) => (prev + 1) % EVALUATION_MESSAGES.length);
    }, 1500);

    return () => {
      window.clearInterval(timer);
    };
  }, [isEvaluating]);

  const progressPercentage = useMemo(() => {
    if (lastPayload) return 100;
    return Math.round((currentStep / TOTAL_STEPS) * 100);
  }, [currentStep, lastPayload]);
  const currentStepKey = getCurrentStepKey(currentStep);

  const updateAnswer = <K extends AnswerKey,>(key: K, value: Answers[K]) => {
    setRespuestas((prev) => ({
      ...prev,
      [key]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [key]: undefined,
    }));
    setSubmissionError('');
  };

  const handleSelectOption = (option: Option) => {
    if (!currentStepKey) return;

    setRespuestas((prev) => ({
      ...prev,
      [currentStepKey]: option,
    }));
    setErrors((prev) => ({
      ...prev,
      [currentStepKey]: undefined,
    }));
    setSubmissionError('');

    window.setTimeout(() => {
      startTransition(() => {
        setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
      });
    }, 140);
  };

  const isOptionSelected = (option: Option): boolean => {
    if (!currentStepKey) return false;
    return respuestas[currentStepKey]?.value === option.value;
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
    setIsEvaluating(true);
    setCurrentStep(99);

    const stepErrors = validateStep(7, answers, isWhatsappValid);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({
        ...prev,
        ...stepErrors,
      }));
      setIsEvaluating(false);
      setCurrentStep(7);
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
    setLastPayload(null);

    try {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      void trackSubmitForm(payload.analytics.eventId, userData).catch((error) => {
        console.error('[LeadflowApplicationForm] SubmitForm tracking failed', error);
      });

      const minimumEvaluationDelay = new Promise((resolve) => {
        window.setTimeout(resolve, EVALUATION_MIN_DURATION_MS);
      });
      const evaluationRequest = fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Leadflow webhook failed with status ${response.status}`);
        }

        return (await response.json()) as LeadflowWebhookResponse;
      });

      const [evaluationResult] = await Promise.allSettled([evaluationRequest, minimumEvaluationDelay]);
      if (evaluationResult.status === 'rejected') {
        throw evaluationResult.reason;
      }

      const evaluation = evaluationResult.value;
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
      setCurrentStep(7);
    } finally {
      setIsEvaluating(false);
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
          <div className="flex min-h-[460px] flex-col justify-center py-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] md:p-6">
              <h1 className="text-2xl font-black leading-tight text-white">🔒 DIAGNÓSTICO DE VIABILIDAD</h1>
              <p className="mt-4 text-base leading-relaxed text-slate-300 md:text-lg">
                Este sistema solo se despliega para organizaciones con tracción operativa real. Evaluaremos tu estructura
                en los próximos 6 pasos para verificar si calificas para la infraestructura de LeadFlow. Si buscas trucos
                gratuitos, puedes cerrar esta pestaña ahora.
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="mt-6 inline-flex min-h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 p-4 text-base font-black uppercase text-white shadow-[0_0_34px_rgba(37,99,235,0.36)] transition hover:scale-[1.01] active:scale-[0.99] md:text-lg"
              >
                <span>⚡ INICIAR MI EVALUACIÓN DE ESTRUCTURA</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      case 1:
        return (
          <StepShell
            eyebrow="PASO 1"
            title="¿De qué tamaño es tu organización activa actualmente?"
            subtitle="Gente cobrando cheques y construyendo, no consumidores durmientes."
          >
            {TEAM_SIZE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                option={option}
                selected={isOptionSelected(option)}
                handleSelectOption={handleSelectOption}
              />
            ))}
            <InlineError message={errors.teamSize} />
          </StepShell>
        );
      case 2:
        return (
          <StepShell
            eyebrow="PASO 2"
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
            {answers.companyProduct.trim().length > 0 && !isValidCompanyText(answers.companyProduct) ? (
              <p className="text-sm font-medium leading-relaxed text-amber-300">{COMPANY_TEXT_WARNING}</p>
            ) : null}
          </StepShell>
        );
      case 3:
        return (
          <StepShell
            eyebrow="PASO 3"
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
            {answers.mainProblem.trim().length > 0 && !isDetailedText(answers.mainProblem) ? (
              <p className="text-sm font-medium leading-relaxed text-amber-300">{DETAILED_TEXT_WARNING}</p>
            ) : null}
          </StepShell>
        );
      case 4:
        return (
          <StepShell
            eyebrow="PASO 4"
            title="Si hoy mismo te apagamos tu lista de contactos conocidos y tus redes sociales personales... ¿Tu red sigue registrando gente mañana?"
          >
            {ACQUISITION_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                option={option}
                selected={isOptionSelected(option)}
                handleSelectOption={handleSelectOption}
              />
            ))}
            <InlineError message={errors.acquisitionThermometer} />
          </StepShell>
        );
      case 5:
        return (
          <StepShell
            eyebrow="PASO 5"
            title="¿Cómo planeas financiar esta infraestructura para tu organización?"
          >
            {INVESTMENT_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                option={option}
                selected={isOptionSelected(option)}
                handleSelectOption={handleSelectOption}
              />
            ))}
            <InlineError message={errors.investmentPosition} />
          </StepShell>
        );
      case 6:
        return (
          <StepShell
            eyebrow="PASO 6"
            title="Si vemos que tu equipo califica para el sistema... ¿La decisión de compra depende 100% de ti o tienes que pedirle permiso a tu Upline o rango superior?"
          >
            {DECISION_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                option={option}
                selected={isOptionSelected(option)}
                handleSelectOption={handleSelectOption}
              />
            ))}
            <InlineError message={errors.purchaseDecision} />
          </StepShell>
        );
      case 7:
        return (
          <StepShell
            eyebrow="PASO 7"
            title="Escribe tu datos de contacto para coordinar la sesión de viabilidad para verificar si LeadFlow es el vehículo de duplicación correcto para tu equipo."
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
  const shouldShowFooter = !isEvaluating && !shouldShowResult && currentStep > 0;
  const isFinalStep = currentStep === TOTAL_STEPS;
  const isChoiceStep = [1, 4, 5, 6].includes(currentStep);
  const isCurrentTextInvalid =
    (currentStep === 2 && !isValidCompanyText(answers.companyProduct)) ||
    (currentStep === 3 && !isDetailedText(answers.mainProblem));
  const shouldShowContinue = !isChoiceStep && !isFinalStep;

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
            style={{ width: `${isEvaluating || shouldShowResult ? 100 : progressPercentage}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <span>{isEvaluating ? 'Evaluando' : shouldShowResult ? 'Resultado' : currentStep === 0 ? 'Auditoría LeadFlow' : `PASO ${currentStep} / ${TOTAL_STEPS}`}</span>
          <span>{isEvaluating || shouldShowResult ? '100%' : `${progressPercentage}%`}</span>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#020617_0%,#000_100%)] px-4 py-4 sm:px-6 sm:py-6"
      >
        {isEvaluating ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center bg-black py-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-950/30 shadow-[0_0_42px_rgba(34,211,238,0.18)]">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
            </div>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Evaluación LeadFlow
            </p>
            <h2 className="mt-4 max-w-md text-2xl font-black leading-tight text-white md:text-4xl">
              Procesando viabilidad operativa
            </h2>
            <p className="mt-5 min-h-[56px] max-w-md text-base font-semibold leading-relaxed text-slate-300 md:text-lg">
              {EVALUATION_MESSAGES[evaluationMessageIndex]}
            </p>
            <div className="mt-8 flex items-center gap-2" aria-hidden="true">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:300ms]" />
            </div>
          </div>
        ) : shouldShowResult && lastPayload ? (
          <div
            className={[
              'mx-auto flex w-full max-w-xl flex-col items-center py-8 text-center md:py-12',
              isQualified ? 'pb-44 md:pb-48' : '',
            ].join(' ')}
          >
            {isQualified ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 text-cyan-200 shadow-[0_0_34px_rgba(34,211,238,0.16)]">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h2 className="mt-6 text-2xl font-black leading-tight text-white md:text-4xl">
                  🔥 ACCESO PRE-APROBADO
                </h2>
                <p className="mt-4 text-base font-semibold leading-relaxed text-slate-200 md:text-lg">
                  Tu perfil cuenta con la madurez operativa requerida. Tienes luz verde para la implementación del
                  sistema.
                </p>

                {aiResponse ? (
                  <div className="mt-6 w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-left shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                      Diagnóstico operativo
                    </p>
                    <div className="space-y-4">{renderAIText(aiResponse)}</div>
                  </div>
                ) : null}

                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/90 p-4 backdrop-blur-md">
                  <div className="mx-auto w-full max-w-xl">
                    <p className="text-center text-sm font-semibold leading-relaxed text-slate-300">
                      Redireccionando al canal oficial de WhatsApp en{' '}
                      <span className="font-black text-cyan-200">{countdown}s</span> para coordinar tu sesión...
                    </p>
                    <a
                      href={WHATSAPP_SUCCESS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex min-h-[68px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 text-lg font-black uppercase leading-tight text-white shadow-[0_0_34px_rgba(37,99,235,0.38)] transition hover:scale-[1.01] active:scale-[0.99]"
                    >
                      🟢 CONECTAR POR WHATSAPP AHORA
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-white/[0.03] text-red-300">
                  <XCircle className="h-8 w-8" />
                </div>
                <h2 className="mt-6 text-2xl font-black leading-tight text-white md:text-4xl">
                  ❌ EVALUACIÓN FINAL: PERFIL NO VIABLE
                </h2>
                <p className="mt-5 text-base font-medium leading-relaxed text-slate-300 md:text-lg">
                  Tras procesar los datos operativos de tu organización, el sistema determinamos que tu estructura actual
                  no cuenta con la masa crítica o el flujo de caja mínimo indispensable para garantizar la duplicación con
                  la infraestructura de LeadFlow en este momento. Agradecemos tu interés.
                </p>
              </>
            )}

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
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 text-sm font-bold uppercase text-slate-400 transition hover:border-white/25 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </button>

            {shouldShowContinue ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={isCurrentTextInvalid}
                className="inline-flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-black uppercase text-white shadow-[0_0_24px_rgba(37,99,235,0.28)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
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
                className="inline-flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-black uppercase text-white shadow-[0_0_24px_rgba(37,99,235,0.28)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando
                  </>
                ) : (
                  <>
                    ⚡ COMPROBAR VIABILIDAD
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
    <div className="flex min-h-[430px] flex-col justify-center py-4 md:min-h-[520px] md:py-6">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
      <h2 className="mb-4 mt-3 text-xl font-bold leading-tight text-white md:text-2xl">{title}</h2>
      {subtitle ? <p className="-mt-2 mb-4 text-base leading-relaxed text-slate-300 md:text-lg">{subtitle}</p> : null}
      <div className="space-y-3 md:space-y-4">{children}</div>
    </div>
  );
}

export default LeadflowApplicationForm;
