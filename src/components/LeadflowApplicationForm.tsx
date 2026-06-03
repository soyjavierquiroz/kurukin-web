import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, MapPin, ShieldCheck, Zap } from 'lucide-react';
import { getCountries, isValidPhoneNumber, type Country } from 'react-phone-number-input';
import SmartPhoneInput from './SmartPhoneInput';
import { useVisitor, type VisitorData } from '../context/VisitorContext';
import { captureClientIp, createAnalyticsEventId, getAnalyticsContext, trackQualifiedLead } from '../lib/analytics';

const TOTAL_STEPS = 7;
const FIRST_FORM_STEP = 1;
const EVALUATION_MIN_DURATION_MS = 5000;
const WHATSAPP_AUTO_OPEN_DELAY_SECONDS = 30;
const WHATSAPP_BLOCKED_FALLBACK_DELAY_MS = 800;
const MIN_COMPANY_TEXT_LENGTH = 4;
const COMPANY_TEXT_WARNING = 'Escribe al menos 4 caracteres para identificar tu compañía o producto.';
const FALLBACK_COUNTRY: Country = 'US';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEADFLOW_EVALUATE_API_URL = '/api/leadflow/evaluate';
const LEADFLOW_LOCAL_DISCARD_API_URL = '/api/leadflow/capture-local-discard';
const SITE_ID = import.meta.env.VITE_SITE_ID || 'kurukinleadflow';
const LEADFLOW_WHATSAPP_NUMBER =
  import.meta.env.VITE_LEADFLOW_WHATSAPP_NUMBER || import.meta.env.VITE_WHATSAPP_NUMBER || '59179790873';
const DISCARD_PUBLIC_TITLE = 'Tenemos una ruta más simple para ti';
const DISCARD_PUBLIC_TEXT =
  [
    'Tu evaluación nos muestra que hay una oportunidad clara para avanzar, pero el siguiente paso no tiene que ser más complejo: tiene que ser más preciso.',
    'Antes de pensar en una infraestructura completa, conviene identificar qué palanca puede ayudarte a generar más conversaciones, ordenar mejor a tu equipo y avanzar con menos fricción.',
    'Escríbenos por WhatsApp con tu código y te orientamos con el siguiente movimiento más inteligente para tu etapa actual.',
  ].join('\n\n');
const EVALUATION_MESSAGES = [
  '🤖 Inicializando motor de evaluación de estructuras...',
  '📊 Analizando métricas de duplicación y retención...',
  '⚙️ Verificando viabilidad de infraestructura financiera...',
  '🔒 Generando diagnóstico final de escala...',
] as const;
const FORBIDDEN_PUBLIC_RESULT_TERMS = [
  /troll/gi,
  /basura/gi,
  /descartad[oa]/gi,
  /descarte/gi,
  /rechazad[oa]/gi,
  /no\s+viable/gi,
  /acceso\s+denegado/gi,
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
    shortLabel: 'Menos de 15 personas',
    label: 'Menos de 15 personas (Sigo haciendo todo el trabajo solo)',
  },
  {
    value: '15_to_50',
    shortLabel: '15 a 50 personas',
    label: 'Entre 15 y 50 personas (Tengo equipo, pero nos estancamos)',
  },
  {
    value: 'more_than_50',
    shortLabel: 'Más de 50 personas',
    label: 'Más de 50 personas (Tengo líneas sólidas y líderes corriendo)',
  },
] as const;

const MAIN_PROBLEM_OPTIONS = [
  {
    value: 'Dependen de mí para presentar y cerrar.',
    label: 'Dependen de mí para presentar y cerrar.',
  },
  {
    value: 'Se quedan sin prospectos muy rápido.',
    label: 'Se quedan sin prospectos muy rápido.',
  },
  {
    value: 'Tienen motivación, pero ningún sistema claro.',
    label: 'Tienen motivación, pero ningún sistema claro.',
  },
  {
    value: 'Se frustran y rinden al primer rechazo.',
    label: 'Se frustran y rinden al primer rechazo.',
  },
  {
    value: 'Recién empiezo, aún no tengo equipo.',
    label: 'Recién empiezo, aún no tengo equipo.',
  },
] as const;

const MAIN_PROBLEM_VALUES: ReadonlySet<string> = new Set(MAIN_PROBLEM_OPTIONS.map(({ value }) => value));

const ACQUISITION_OPTIONS = [
  {
    value: 'no_survival',
    shortLabel: 'Mensajes en frío',
    label: 'No. Dependemos 100% de perseguir amigos, familiares y mandar mensajes en frío',
  },
  {
    value: 'organic_hope',
    shortLabel: 'Orgánico (TikTok/Reels)',
    label: 'Dependemos de subir Reels y TikToks rezando para que el algoritmo nos traiga interesados',
  },
  {
    value: 'paid_no_system',
    shortLabel: 'Tráfico pago sin cierre',
    label: 'Ya metemos publicidad pagada, pero mi equipo no sabe cómo cerrar prospectos en frío',
  },
] as const;

const INVESTMENT_OPTIONS = [
  {
    value: 'capital_ready',
    shortLabel: 'Capital listo',
    label: 'Tengo el capital listo (Inversión superior a $2,000 USD) si el sistema me convence.',
  },
  {
    value: 'team_pool',
    shortLabel: 'Co-inversión (Vaca)',
    label: "Voy a armar una 'vaca' (co-inversión) con mis líderes clave para dividir el costo de las licencias",
  },
  {
    value: 'no_budget',
    shortLabel: 'Sin presupuesto',
    label: 'No cuento con más de $100 USD en este momento.',
  },
] as const;

const DECISION_OPTIONS = [
  {
    value: 'yes',
    shortLabel: 'Decisión propia',
    label: 'Depende 100% de mí. Yo decido qué herramientas usa mi organización',
  },
  {
    value: 'need_upline',
    shortLabel: 'Consulta Upline/Socios',
    label: 'Tengo que consultarlo con mi línea ascendente, socios o patrocinador',
  },
] as const;

type FinalStatus = 'calificado_llamada' | 'rechazado';
type AnalyticsPayloadContext = ReturnType<typeof getAnalyticsContext>;
type RadioAnswerKey = 'teamSize' | 'acquisitionThermometer' | 'investmentPosition' | 'purchaseDecision';
type MainProblemOption = (typeof MAIN_PROBLEM_OPTIONS)[number]['value'];

interface Option {
  value: string;
  label: string;
  shortLabel?: string;
}

interface Answers {
  teamSize: Option | null;
  companyProduct: string;
  mainProblem: MainProblemOption | '';
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
  visitor: {
    city: string;
    region: string;
    country_name: string;
    country_code: string;
  } | null;
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

type LeadflowTier = 'ORO' | 'PLATA' | 'DESCARTE';

interface LeadflowEvaluationResponse {
  success: boolean;
  status: LeadflowTier;
  rawStatus?: string;
  isQualified: boolean;
  tierCode: string;
  aiConsultingText: string;
  publicResultText: string;
  dolorPsicologico?: string | null;
  estrategiaCierre?: string | null;
  crmContactId?: string | null;
  whatsappMessage: string;
  whatsappUrl?: string;
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

function isValidCompanyText(value: string): boolean {
  return value.trim().length >= MIN_COMPANY_TEXT_LENGTH;
}

function isMainProblemOption(value: string): value is MainProblemOption {
  return MAIN_PROBLEM_VALUES.has(value);
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

function isLocalGuillotine(answers: Answers): boolean {
  return (
    answers.teamSize?.value === 'less_than_15' ||
    answers.mainProblem === 'Recién empiezo, aún no tengo equipo.' ||
    answers.investmentPosition?.value === 'no_budget'
  );
}

function sanitizePublicResultText(value?: string): string {
  const rawText = value?.trim() || DISCARD_PUBLIC_TEXT;

  return FORBIDDEN_PUBLIC_RESULT_TERMS.reduce(
    (text, pattern) => text.replace(pattern, 'requiere una revisión más cuidadosa'),
    rawText,
  )
    .replace(/\s{2,}/g, ' ')
    .trim();
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
    visitor: visitorData
      ? {
          city: visitorData.city,
          region: visitorData.region,
          country_name: visitorData.country_name,
          country_code: visitorData.country_code,
        }
      : null,
    respuestas: {
      tamano_equipo: answers.teamSize
        ? { value: answers.teamSize.value, label: answers.teamSize.shortLabel ?? answers.teamSize.label }
        : null,
      compania_producto: answers.companyProduct.trim(),
      principal_problema: answers.mainProblem.trim(),
      inversion_ads: answers.acquisitionThermometer
        ? {
            value: answers.acquisitionThermometer.value,
            label: answers.acquisitionThermometer.shortLabel ?? answers.acquisitionThermometer.label,
          }
        : null,
      posicion_frente_a_inversion: answers.investmentPosition
        ? {
            value: answers.investmentPosition.value,
            label: answers.investmentPosition.shortLabel ?? answers.investmentPosition.label,
          }
        : null,
      decision_de_compra: answers.purchaseDecision
        ? { value: answers.purchaseDecision.value, label: answers.purchaseDecision.shortLabel ?? answers.purchaseDecision.label }
        : null,
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

async function submitLeadflowEvaluation(payload: LeadflowPayload): Promise<LeadflowEvaluationResponse> {
  const response = await fetch(LEADFLOW_EVALUATE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Leadflow evaluation failed with status ${response.status}`);
  }

  return (await response.json()) as LeadflowEvaluationResponse;
}

async function submitLocalDiscard(payload: LeadflowPayload): Promise<LeadflowEvaluationResponse> {
  const response = await fetch(LEADFLOW_LOCAL_DISCARD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Leadflow local discard capture failed with status ${response.status}`);
  }

  return (await response.json()) as LeadflowEvaluationResponse;
}

function buildTierCode(tier: LeadflowTier): string {
  const prefixByTier: Record<LeadflowTier, string> = {
    ORO: 'KLF-A',
    PLATA: 'KLF-B',
    DESCARTE: 'KLF-C',
  };

  return `${prefixByTier[tier]}-${getRandomCodeSuffix()}`;
}

function buildFallbackWhatsAppMessage(payload: LeadflowPayload, tierCode: string): string {
  const nombre = payload.nombre_completo || 'Javier';
  const compania = payload.respuestas.compania_producto || 'mi compañía';

  return [
    `Hola, soy ${nombre}. Vengo de la evaluación LeadFlow para mi organización de multinivel en ${compania}.`,
    '',
    'Quiero saber cuál es el siguiente paso recomendado para mi etapa actual.',
    '',
    `Mi código de evaluación es: ${tierCode}`,
  ].join('\n');
}

function getRandomCodeSuffix(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  return Math.random().toString(36).replace(/[^a-z0-9]/gi, '').slice(2, 10).toUpperCase().padEnd(6, '0');
}

function buildFallbackEvaluation(payload: LeadflowPayload): LeadflowEvaluationResponse {
  const tierCode = buildTierCode('DESCARTE');

  return {
    success: true,
    status: 'DESCARTE',
    rawStatus: 'FALLBACK_REVIEW',
    isQualified: false,
    tierCode,
    aiConsultingText: '',
    publicResultText: DISCARD_PUBLIC_TEXT,
    dolorPsicologico: null,
    estrategiaCierre: null,
    crmContactId: null,
    whatsappMessage: buildFallbackWhatsAppMessage(payload, tierCode),
  };
}

function buildWhatsAppUrl(message: string): string {
  return `https://api.whatsapp.com/send?phone=${LEADFLOW_WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
}

function getWhatsAppUrl(result: LeadflowEvaluationResponse): string {
  if (result.whatsappUrl) return result.whatsappUrl;

  const message =
    result.whatsappMessage ||
    `Hola, vengo de la evaluación LeadFlow. Mi código de evaluación es: ${result.tierCode}`;

  return buildWhatsAppUrl(message);
}

function getWhatsAppLogUrl(whatsappUrl: string): string {
  return whatsappUrl.split('?')[0];
}

function openWhatsApp(result: LeadflowEvaluationResponse): void {
  const whatsappUrl = getWhatsAppUrl(result);

  if (import.meta.env.DEV) {
    console.log('[LeadflowApplicationForm] WhatsApp click', getWhatsAppLogUrl(whatsappUrl));
  }

  const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.setTimeout(() => {
      window.location.href = whatsappUrl;
    }, WHATSAPP_BLOCKED_FALLBACK_DELAY_MS);
  }
}

function isQualifiedTier(status: LeadflowTier): boolean {
  return status === 'ORO' || status === 'PLATA';
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
      if (!answers.mainProblem) nextErrors.mainProblem = 'Selecciona el freno principal de tu equipo.';
      else if (!isMainProblemOption(answers.mainProblem)) nextErrors.mainProblem = 'Selecciona una opción válida.';
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

  return <p className="mt-2 text-sm font-medium text-amber-400">{message}</p>;
}

function OptionButton({ option, selected, handleSelectOption }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={() => handleSelectOption(option)}
      className={[
        'group flex min-h-[64px] w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition duration-200 md:min-h-[72px] md:p-4',
        'border-zinc-800 bg-zinc-900/60 shadow-[0_0_80px_rgba(0,0,0,0.16)] backdrop-blur-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
        selected
          ? 'border-amber-500/30 bg-zinc-900 ring-1 ring-white/10 shadow-[0_14px_32px_rgba(0,0,0,0.46)]'
          : 'hover:border-zinc-600 hover:bg-neutral-900',
      ].join(' ')}
      aria-pressed={selected}
    >
      <span
        className={[
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition',
          selected ? 'border-amber-500/30 bg-zinc-950 text-amber-400' : 'border-zinc-700 bg-zinc-950 text-transparent',
        ].join(' ')}
        aria-hidden="true"
      >
        <CheckCircle2 className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold leading-snug text-white md:text-lg">{option.label}</span>
    </button>
  );
}

export function LeadflowApplicationForm({ className = '', onPayloadReady }: LeadflowApplicationFormProps) {
  const { visitorData, isLoading: isVisitorLoading } = useVisitor();
  const [currentStep, setCurrentStep] = useState(FIRST_FORM_STEP);
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
  const [evaluationResult, setEvaluationResult] = useState<LeadflowEvaluationResponse | null>(null);
  const [isQualified, setIsQualified] = useState(false);
  const [countdown, setCountdown] = useState(WHATSAPP_AUTO_OPEN_DELAY_SECONDS);
  const hasManualCountrySelectionRef = useRef(false);
  const analyticsRef = useRef<AnalyticsPayloadContext | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const qualifiedLeadTrackedEventRef = useRef<string | null>(null);
  const hasAutoOpenedWhatsappRef = useRef(false);
  const shouldShowResult = Boolean(lastPayload && evaluationResult);
  const whatsappHref = evaluationResult ? getWhatsAppUrl(evaluationResult) : '';
  const canOpenWhatsApp = Boolean(whatsappHref && (evaluationResult?.whatsappMessage || evaluationResult?.tierCode));
  const shouldAutoOpenWhatsApp = Boolean(shouldShowResult && canOpenWhatsApp);
  const qualifiedFinalState = Boolean(shouldShowResult && isQualified);

  const redirectToWhatsApp = useCallback(() => {
    if (!evaluationResult?.whatsappMessage && !evaluationResult?.tierCode) return;
    openWhatsApp(evaluationResult);
  }, [evaluationResult]);

  useEffect(() => {
    analyticsRef.current = {
      ...getAnalyticsContext('Lead_Calificado', createAnalyticsEventId('Lead_Calificado')),
      siteId: SITE_ID,
    };

    void captureClientIp().then((clientIp) => {
      analyticsRef.current = {
        ...getAnalyticsContext('Lead_Calificado', analyticsRef.current?.eventId),
        siteId: SITE_ID,
        client_ip: clientIp,
        clientIp,
      };
    });
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
    if (!shouldAutoOpenWhatsApp) return;

    setCountdown(WHATSAPP_AUTO_OPEN_DELAY_SECONDS);
    hasAutoOpenedWhatsappRef.current = false;
  }, [evaluationResult?.tierCode, shouldAutoOpenWhatsApp]);

  useEffect(() => {
    if (!shouldAutoOpenWhatsApp) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [shouldAutoOpenWhatsApp]);

  useEffect(() => {
    if (!shouldAutoOpenWhatsApp || countdown > 0 || hasAutoOpenedWhatsappRef.current) return;

    hasAutoOpenedWhatsappRef.current = true;
    redirectToWhatsApp();
  }, [countdown, redirectToWhatsApp, shouldAutoOpenWhatsApp]);

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
  const aiConsultingText = sanitizePublicResultText(evaluationResult?.publicResultText);
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

  const handleSelectMainProblem = (option: Option) => {
    const mainProblem = option.value;
    if (!isMainProblemOption(mainProblem)) return;

    setRespuestas((prev) => ({
      ...prev,
      mainProblem,
    }));
    setErrors((prev) => ({
      ...prev,
      mainProblem: undefined,
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
      setCurrentStep((prev) => Math.max(prev - 1, FIRST_FORM_STEP));
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

    const clientIp = await captureClientIp();
    const leadQualifiedEventId = createAnalyticsEventId('Lead_Calificado');
    const analyticsContext = {
      ...getAnalyticsContext('Lead_Calificado', leadQualifiedEventId),
      siteId: SITE_ID,
      client_ip: clientIp,
      clientIp,
    };
    analyticsRef.current = analyticsContext;

    const payload = buildPayload({
      answers: {
        ...answers,
        country: answers.country || selectedCountry,
      },
      visitorData,
      analyticsContext,
    });
    const userData = buildUserData(answers);
    const isDisqualified = isLocalGuillotine(answers);

    setIsSubmitting(true);
    setSubmissionError('');
    setEvaluationResult(null);
    setIsQualified(false);
    setLastPayload(null);
    qualifiedLeadTrackedEventRef.current = null;
    hasAutoOpenedWhatsappRef.current = false;

    try {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      const minimumEvaluationDelay = new Promise((resolve) => {
        window.setTimeout(resolve, EVALUATION_MIN_DURATION_MS);
      });
      const evaluation = isDisqualified ? await submitLocalDiscard(payload) : await submitLeadflowEvaluation(payload);

      await minimumEvaluationDelay;

      const approved = !isDisqualified && isQualifiedTier(evaluation.status);
      const classification = evaluation.status;
      const finalPayload: LeadflowPayload = {
        ...payload,
        autoreject_triggered: isDisqualified || !approved,
        final_status: approved ? 'calificado_llamada' : 'rechazado',
      };

      if (approved && qualifiedLeadTrackedEventRef.current !== payload.analytics.eventId) {
        qualifiedLeadTrackedEventRef.current = payload.analytics.eventId;
        void trackQualifiedLead(payload.analytics.eventId, userData, classification).catch((error) => {
          console.error('[LeadflowApplicationForm] QualifiedLead tracking failed', error);
        });
        setIsQualified(true);
      } else {
        setIsQualified(false);
      }

      try {
        await onPayloadReady?.(finalPayload);
      } catch (error) {
        console.error('[LeadflowApplicationForm] onPayloadReady failed', error);
      }

      setLastPayload(finalPayload);
      setEvaluationResult(evaluation);
    } catch (error) {
      console.error('[LeadflowApplicationForm] submission failed', error);
      const fallbackEvaluation = buildFallbackEvaluation(payload);
      const finalPayload: LeadflowPayload = {
        ...payload,
        autoreject_triggered: true,
        final_status: 'rechazado',
      };

      setIsQualified(false);
      setLastPayload(finalPayload);
      setEvaluationResult(fallbackEvaluation);
      setSubmissionError('');

      try {
        await onPayloadReady?.(finalPayload);
      } catch (onPayloadReadyError) {
        console.error('[LeadflowApplicationForm] onPayloadReady failed', onPayloadReadyError);
      }
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
          'min-h-[48px] w-full rounded-xl border bg-zinc-950 p-3 text-base font-semibold text-white outline-none transition md:min-h-[56px] md:p-4 md:text-lg',
          'placeholder:text-slate-600 focus:border-amber-500/30 focus:ring-2 focus:ring-white/10',
          error ? 'border-amber-500/30' : 'border-zinc-800',
        ].join(' ')}
      />
      <InlineError message={error} />
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepShell
            eyebrow="PASO 1"
            authorityText="Diseñar sistemas operativos que no dependan del tráfico orgánico requiere estructura. Comencemos por entender tus cimientos actuales."
            title="¿Cuántas personas forman parte de tu equipo actualmente?"
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
              <p className="text-sm font-medium leading-relaxed text-amber-400">{COMPANY_TEXT_WARNING}</p>
            ) : null}
          </StepShell>
        );
      case 3:
        return (
          <StepShell
            eyebrow="PASO 3"
            title="Sé brutalmente honesto: ¿Cuál es el freno número uno en tu equipo por el cual tu gente no duplica y tu cheque se estancó?"
          >
            {MAIN_PROBLEM_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                option={option}
                selected={answers.mainProblem === option.value}
                handleSelectOption={handleSelectMainProblem}
              />
            ))}
            <InlineError message={errors.mainProblem} />
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
                  'text-base',
                  '[&_.PhoneInputCountry]:!h-12 [&_.PhoneInputCountry]:!min-h-[48px] [&_.PhoneInputCountry]:!min-w-[96px] [&_.PhoneInputCountry]:!px-3 md:[&_.PhoneInputCountry]:!min-w-[112px]',
                  '[&_.PhoneInputInput]:!h-12 [&_.PhoneInputInput]:!min-h-[48px] [&_.PhoneInputInput]:!px-3 [&_.PhoneInputInput]:!text-base [&_.PhoneInputInput]:!font-semibold md:[&_.PhoneInputInput]:!px-4 md:[&_.PhoneInputInput]:!text-lg',
                  '[&_.SmartPhoneCallingCode]:!text-sm md:[&_.SmartPhoneCallingCode]:!text-base',
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
                <div className="rounded-xl border border-amber-500/30 bg-zinc-900 p-4 text-sm font-semibold text-amber-400">
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

  const shouldShowFooter = !isEvaluating && !shouldShowResult && currentStep > FIRST_FORM_STEP;
  const isFinalStep = currentStep === TOTAL_STEPS;
  const isChoiceStep = [1, 3, 4, 5, 6].includes(currentStep);
  const isCurrentTextInvalid =
    currentStep === 2 && !isValidCompanyText(answers.companyProduct);
  const shouldShowContinue = !isChoiceStep && !isFinalStep;
  const resultStatus = evaluationResult?.status ?? 'DESCARTE';
  const resultTitle =
    resultStatus === 'ORO'
      ? '🔥 Tu evaluación fue aprobada'
      : resultStatus === 'PLATA'
        ? '⚡ Tu evaluación requiere validación'
        : DISCARD_PUBLIC_TITLE;
  const resultCtaLabel =
    resultStatus === 'ORO'
      ? '🟢 ENVIAR WHATSAPP CON MI CÓDIGO'
      : resultStatus === 'PLATA'
        ? '🟢 VALIDAR MI CASO POR WHATSAPP'
        : '🟡 CONSULTAR SIGUIENTE PASO POR WHATSAPP';
  const ResultIcon = resultStatus === 'ORO' ? ShieldCheck : resultStatus === 'PLATA' ? Zap : MapPin;
  const resultBodyText = resultStatus === 'DESCARTE' ? DISCARD_PUBLIC_TEXT : aiConsultingText;
  const resultBodyParagraphs = resultBodyText.split(/\n{2,}/).filter(Boolean);
  const handleWhatsAppClick = () => {
    if (!import.meta.env.DEV || !whatsappHref) return;
    console.log('[LeadflowApplicationForm] WhatsApp click', getWhatsAppLogUrl(whatsappHref));
  };

  return (
    <section
      className={[
        'relative flex h-full w-full flex-col overflow-hidden bg-black text-white',
        'sm:rounded-2xl sm:border sm:border-zinc-800 sm:bg-zinc-950/95 sm:backdrop-blur-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <style>
        {`@keyframes leadflowCtaGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }`}
      </style>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_75%)]" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-zinc-900/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-neutral-900/30 blur-3xl" />
      <header className="relative z-10 shrink-0 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={[
              'h-full rounded-full bg-red-500 transition-all duration-500 ease-out',
            ].join(' ')}
            style={{ width: `${isEvaluating || shouldShowResult ? 100 : progressPercentage}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <span>{isEvaluating ? 'Evaluando' : shouldShowResult ? 'Resultado' : `PASO ${currentStep} / ${TOTAL_STEPS}`}</span>
          <span>{isEvaluating || shouldShowResult ? '100%' : `${progressPercentage}%`}</span>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:px-6 sm:py-6 [&::-webkit-scrollbar]:hidden"
      >
        {isEvaluating ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center py-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 shadow-[0_18px_42px_rgba(0,0,0,0.5)]">
              <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
            </div>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-amber-400">
              Evaluación LeadFlow
            </p>
            <h2 className="mt-4 max-w-md text-2xl font-black leading-tight text-white md:text-4xl">
              Procesando viabilidad operativa
            </h2>
            <p className="mt-5 min-h-[56px] max-w-md text-base font-semibold leading-relaxed text-white md:text-lg">
              {EVALUATION_MESSAGES[evaluationMessageIndex]}
            </p>
            <div className="mt-8 flex items-center gap-2" aria-hidden="true">
              <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 [animation-delay:300ms]" />
            </div>
          </div>
        ) : shouldShowResult && lastPayload && evaluationResult ? (
          <div
            className={[
              'mx-auto flex w-full max-w-xl flex-col items-center pt-4 text-center md:pt-8',
              'pb-56 md:pb-52',
            ].join(' ')}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-amber-400 shadow-[0_14px_28px_rgba(0,0,0,0.42)] md:h-14 md:w-14">
              <ResultIcon className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight text-white md:mt-4 md:text-3xl">
              {resultTitle}
            </h2>

            <div className="mt-4 max-h-[40svh] w-full overflow-y-auto rounded-xl border border-amber-500/30 bg-zinc-900 p-4 text-left text-sm font-semibold leading-relaxed text-white shadow-[0_18px_36px_rgba(0,0,0,0.32)] md:mt-5 md:max-h-none md:p-5 md:text-base">
              <div className="space-y-3">
                {resultBodyParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-amber-400">
                Código: {evaluationResult.tierCode}
              </p>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 p-3 backdrop-blur-md md:p-4">
              <div className="mx-auto w-full max-w-xl">
                <p className="text-center text-sm font-semibold">
                  Escríbenos por WhatsApp con tu código para continuar.
                </p>
                {qualifiedFinalState ? (
                  <p className="mt-2 rounded-lg border border-amber-500/30 bg-red-500/10 px-3 py-2 text-center text-xs font-black leading-snug text-red-200 ring-1 ring-red-400/30 md:text-sm">
                    Tu prioridad de agenda se mantiene por{' '}
                    <span className="inline-flex min-w-10 justify-center rounded-md bg-red-500 px-2 py-0.5 text-white">
                      {countdown}s
                    </span>
                    .
                  </p>
                ) : null}
                <a
                  href={canOpenWhatsApp ? whatsappHref : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  className="mt-2 inline-flex min-h-[54px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-4 py-3 text-sm font-black uppercase leading-tight text-slate-950 shadow-[0_16px_30px_rgba(0,0,0,0.46)] transition hover:scale-[1.01] active:scale-[0.99] md:mt-3 md:min-h-[62px] md:text-lg"
                >
                  {resultCtaLabel}
                </a>
              </div>
            </div>
          </div>
        ) : (
          renderStepContent()
        )}
      </div>

      {shouldShowFooter ? (
        <footer className="relative z-10 mt-6 shrink-0 border-t border-zinc-800 bg-zinc-950/90 p-4 backdrop-blur-md">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 text-sm font-bold uppercase text-slate-400 transition hover:border-white/25 hover:text-white sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </button>

            {shouldShowContinue ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={isCurrentTextInvalid}
                className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-5 text-sm font-black uppercase text-slate-950 shadow-[0_14px_28px_rgba(0,0,0,0.44)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:flex-none"
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
                className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-5 text-sm font-black uppercase text-slate-950 shadow-[0_14px_28px_rgba(0,0,0,0.44)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:flex-none"
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
  authorityText,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  authorityText?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col justify-start py-4 md:min-h-[520px] md:justify-center md:py-6">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-400">{eyebrow}</p>
      {authorityText ? (
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-[0_18px_36px_rgba(0,0,0,0.3)] md:p-5">
          <p className="text-base font-black leading-snug text-white md:text-lg">
            {authorityText}
          </p>
        </div>
      ) : null}
      <h2 className="mb-3 mt-4 text-lg font-bold leading-tight text-white md:mb-4 md:text-2xl">{title}</h2>
      {subtitle ? <p className="-mt-1 mb-4 text-sm leading-relaxed text-white">{subtitle}</p> : null}
      <div className="space-y-4 md:space-y-5">{children}</div>
    </div>
  );
}

export default LeadflowApplicationForm;
