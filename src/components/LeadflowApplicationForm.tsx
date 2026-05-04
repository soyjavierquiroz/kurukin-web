import { startTransition, useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import {
  getCountries,
  isValidPhoneNumber,
  type Country,
} from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import SmartPhoneInput from './SmartPhoneInput';
import { useVisitor, type VisitorData } from '../context/VisitorContext';

const TOTAL_STEPS = 13;
const MIN_TEXTAREA_LENGTH = 20;
const FALLBACK_COUNTRY: Country = 'US';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  { value: 'more_than_50', label: 'Más de 50', score: 25 },
  { value: '20_to_50', label: '20 a 50', score: 20 },
  { value: '10_to_20', label: '10 a 20', score: 10 },
  { value: 'less_than_10', label: 'Menos de 10', score: 0 },
  { value: 'no_team', label: 'No tengo equipo', score: 0, autoReject: true },
] as const;

const CONSISTENT_SALES_OPTIONS = [
  { value: 'consistent_yes', label: 'Sí, consistentemente', score: 20 },
  { value: 'irregular_yes', label: 'Sí, pero irregular', score: 10 },
  { value: 'no', label: 'No', score: 0 },
] as const;

const AD_SPEND_OPTIONS = [
  { value: '1000_plus', label: '$1,000+', score: 25 },
  { value: '500_to_1000', label: '$500–$1,000', score: 20 },
  { value: '100_to_500', label: '$100–$500', score: 10 },
  { value: 'less_than_100', label: 'Menos de $100', score: 0, autoReject: true },
] as const;

const INVESTMENT_COVERAGE_OPTIONS = [
  { value: 'leader_only', label: 'Yo como líder', score: 5 },
  { value: 'distributed_team', label: 'Mi equipo distribuido', score: 5 },
  { value: 'combined', label: 'Combinación de ambos', score: 10 },
  { value: 'unknown', label: 'Aún no lo sé', score: -5 },
] as const;

const LEAD_SOURCE_OPTIONS = [
  { value: 'paid_ads', label: 'Publicidad pagada' },
  { value: 'organic_content', label: 'Contenido orgánico' },
  { value: 'referrals', label: 'Referidos' },
  { value: 'events', label: 'Eventos / networking' },
  { value: 'direct_outreach', label: 'Prospección directa' },
  { value: 'no_system', label: 'No tenemos sistema' },
] as const;

const LEAD_RESPONSE_OPTIONS = [
  { value: 'most_know_how', label: 'La mayoría sabe', score: 10 },
  { value: 'mixed', label: 'Algunos sí otros no', score: 5 },
  { value: 'no', label: 'No saben', score: 0 },
] as const;

const URGENCY_OPTIONS = [
  { value: 'immediately', label: 'Inmediatamente', score: 15 },
  { value: 'in_30_days', label: 'En 30 días', score: 10 },
  { value: 'in_90_days', label: 'En 90 días', score: 5 },
  { value: 'just_exploring', label: 'Solo explorando', score: 0, autoReject: true },
] as const;

const PURCHASE_DECISION_OPTIONS = [
  { value: 'yes', label: 'Sí', score: 15 },
  { value: 'with_someone_else', label: 'Lo decido con alguien más', score: 5 },
  { value: 'no', label: 'No', score: 0 },
] as const;

const INVESTMENT_POSITION_OPTIONS = [
  { value: 'capital_ready', label: 'Tengo el capital listo', score: 20 },
  { value: 'shared_capital', label: 'Puedo cubrirlo con mi equipo/compartido', score: 20 },
  { value: 'partial_gap', label: 'Tendría que resolver una parte', score: 10 },
  { value: 'no_capital', label: 'No dispongo de capital', score: 0, autoReject: true },
] as const;

const AUTO_ADVANCE_STEPS = new Set([1, 3, 5, 6, 8, 9, 11, 12]);

const STEP_META = [
  {
    eyebrow: 'Paso 1 de 13',
    title: '¿Qué tamaño tiene hoy tu equipo?',
    description: 'Esto nos dice si ya existe una base real para escalar con infraestructura.',
  },
  {
    eyebrow: 'Paso 2 de 13',
    title: '¿Cuál es tu compañía o producto principal?',
    description: 'Queremos ubicar el contexto exacto de la operación que buscas acelerar.',
  },
  {
    eyebrow: 'Paso 3 de 13',
    title: '¿Tu operación ya genera ventas consistentes?',
    description: 'Leadflow acelera lo que ya tiene algo de tracción, no reemplaza el market fit.',
  },
  {
    eyebrow: 'Paso 4 de 13',
    title: '¿Cuál es hoy tu principal problema para crecer?',
    description: 'Explícalo con claridad para entender dónde está el cuello de botella real.',
  },
  {
    eyebrow: 'Paso 5 de 13',
    title: '¿Cuánto están invirtiendo hoy en anuncios?',
    description: 'Buscamos operaciones con capacidad mínima de adquisición.',
  },
  {
    eyebrow: 'Paso 6 de 13',
    title: '¿Quién cubre normalmente la inversión para crecer?',
    description: 'Esto nos ayuda a medir velocidad de ejecución y fricción interna.',
  },
  {
    eyebrow: 'Paso 7 de 13',
    title: '¿Cómo están generando leads hoy?',
    description: 'Puedes marcar varias opciones. Selecciona al menos una.',
  },
  {
    eyebrow: 'Paso 8 de 13',
    title: 'Cuando entra un lead, ¿tu equipo sabe responderlo?',
    description: 'La calidad de respuesta define si el sistema realmente convierte.',
  },
  {
    eyebrow: 'Paso 9 de 13',
    title: '¿Qué tan urgente es resolver esto?',
    description: 'Necesitamos saber si estás evaluando de verdad o solo explorando ideas.',
  },
  {
    eyebrow: 'Paso 10 de 13',
    title: '¿Por qué esto es importante para ti justo ahora?',
    description: 'Cuéntanos qué cambió o qué riesgo ya no quieres seguir tolerando.',
  },
  {
    eyebrow: 'Paso 11 de 13',
    title: '¿Tienes decisión de compra sobre esta implementación?',
    description: 'Esto define la ruta correcta después del diagnóstico.',
  },
  {
    eyebrow: 'Paso 12 de 13',
    title:
      'Sabiendo que esta infraestructura requiere una inversión a partir de $3,500 USD para su implementación, ¿cuál es tu posición actual?',
    description: 'Necesitamos confirmar si el proyecto puede ejecutarse sin quedar bloqueado en el arranque.',
  },
  {
    eyebrow: 'Paso 13 de 13',
    title: 'Último paso: Datos de contacto.',
    description: 'Tu país se precarga automáticamente, pero puedes ajustarlo si hace falta.',
  },
] as const;

type FinalStatus = 'calificado_llamada' | 'sesion_pagada' | 'rechazado';
type AutoAdvanceKey =
  | 'teamSize'
  | 'consistentSales'
  | 'adSpend'
  | 'investmentCoverage'
  | 'leadResponseCapability'
  | 'urgency'
  | 'purchaseDecision'
  | 'investmentPosition';

interface Answers {
  teamSize: string;
  companyProduct: string;
  consistentSales: string;
  mainProblem: string;
  adSpend: string;
  investmentCoverage: string;
  leadSources: string[];
  leadResponseCapability: string;
  urgency: string;
  whyNow: string;
  purchaseDecision: string;
  investmentPosition: string;
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
  ttc: string | null;
  respuestas: {
    tamano_equipo: { value: string; label: string } | null;
    compania_producto: string;
    ventas_consistentes: { value: string; label: string } | null;
    principal_problema: string;
    inversion_ads: { value: string; label: string } | null;
    quien_cubre_inversion: { value: string; label: string } | null;
    generacion_de_leads: Array<{ value: string; label: string }>;
    respuesta_de_leads: { value: string; label: string } | null;
    urgencia: { value: string; label: string } | null;
    motivacion_actual: string;
    decision_de_compra: { value: string; label: string } | null;
    posicion_frente_a_inversion: { value: string; label: string } | null;
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
  score_total: number;
  autoreject_triggered: boolean;
  final_status: FinalStatus;
}

interface LeadflowApplicationFormProps {
  className?: string;
  onPayloadReady?: (payload: LeadflowPayload) => Promise<void> | void;
}

interface QualificationSummary {
  scoreTotal: number;
  autorejectTriggered: boolean;
  finalStatus: FinalStatus;
}

interface LeadflowAiWebhookResponse {
  es_valido?: boolean;
  ai_consulting_text?: string;
}

interface InitialLeadUserData {
  email?: string;
  phone?: string;
  name?: string;
}

interface PreparedLeadUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

interface FbqTrackFunction {
  (...args: readonly unknown[]): void;
}

interface TikTokTrackFunction {
  track?: (eventName: string, params?: Record<string, unknown>) => void;
  identify?: (payload: Record<string, string>) => void;
}

declare global {
  interface Window {
    fbq?: FbqTrackFunction;
    ttq?: TikTokTrackFunction;
  }
}

interface OptionButtonProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  multiSelect?: boolean;
}

interface CountrySelectFieldProps {
  value: Country | '';
  error?: string;
  disabled?: boolean;
  onChange: (value: Country) => void;
}

interface TrackingClickIds {
  fbc: string | null;
  ttc: string | null;
}

const QUALIFIED_LEAD_TRACKING_PARAMS = {
  content_name: 'Lead Calificado',
  value: 10.0,
  currency: 'USD',
} as const;

const QUALIFIED_FINAL_STATUSES: ReadonlySet<FinalStatus> = new Set(['calificado_llamada', 'sesion_pagada']);
const TRACKING_STORAGE_PREFIX = 'leadflow.capi';
const META_FBC_COOKIE_NAME = '_fbc';
const TIKTOK_TTCLID_COOKIE_NAME = 'ttclid';

const INITIAL_ANSWERS: Answers = {
  teamSize: '',
  companyProduct: '',
  consistentSales: '',
  mainProblem: '',
  adSpend: '',
  investmentCoverage: '',
  leadSources: [],
  leadResponseCapability: '',
  urgency: '',
  whyNow: '',
  purchaseDecision: '',
  investmentPosition: '',
  fullName: '',
  whatsapp: '',
  email: '',
  country: '',
};

function resolveCountryLabel(country: Country | ''): string {
  if (!country) return '';

  try {
    const displayNames = new Intl.DisplayNames(['es'], { type: 'region' });
    return displayNames.of(country) ?? country;
  } catch {
    return country;
  }
}

const COUNTRY_LABELS = new Map<Country, string>(
  ALLOWED_COUNTRIES.map((country) => [country, resolveCountryLabel(country)]),
);

function normalizeCountry(countryCode?: string): Country {
  if (!countryCode) return FALLBACK_COUNTRY;

  const normalized = countryCode.toUpperCase() as Country;
  return ALLOWED_COUNTRIES.includes(normalized) ? normalized : FALLBACK_COUNTRY;
}

function safeValidatePhone(value: string): boolean {
  if (!value.trim()) return false;

  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

function normalizeNullable(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const encodedName = `${name}=`;
  const segments = document.cookie.split('; ');
  const target = segments.find((segment) => segment.startsWith(encodedName));

  if (!target) {
    return null;
  }

  return normalizeNullable(decodeURIComponent(target.slice(encodedName.length)));
}

function writeCookieValue(name: string, value: string, days = 90): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function readStorageValue(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return normalizeNullable(window.localStorage.getItem(key)) ?? normalizeNullable(window.sessionStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures.
  }
}

function createMetaFbc(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`;
}

function captureTrackingClickIds(): TrackingClickIds {
  if (typeof window === 'undefined') {
    return { fbc: null, ttc: null };
  }

  const params = new URLSearchParams(window.location.search);
  const fbclid = normalizeNullable(params.get('fbclid'));
  const ttclid = normalizeNullable(params.get('ttclid'));
  const storedFbc = readStorageValue(`${TRACKING_STORAGE_PREFIX}.fbc`);
  const storedTtc = readStorageValue(`${TRACKING_STORAGE_PREFIX}.ttc`);
  const cookieFbc = readCookieValue(META_FBC_COOKIE_NAME);
  const cookieTtc = readCookieValue(TIKTOK_TTCLID_COOKIE_NAME) ?? readCookieValue('ttc');

  const fbc = cookieFbc ?? storedFbc ?? (fbclid ? createMetaFbc(fbclid) : null);
  const ttc = ttclid ?? cookieTtc ?? storedTtc;

  if (fbc) {
    writeStorageValue(`${TRACKING_STORAGE_PREFIX}.fbc`, fbc);
    if (!cookieFbc) {
      writeCookieValue(META_FBC_COOKIE_NAME, fbc);
    }
  }

  if (ttc) {
    writeStorageValue(`${TRACKING_STORAGE_PREFIX}.ttc`, ttc);
    if (!cookieTtc) {
      writeCookieValue(TIKTOK_TTCLID_COOKIE_NAME, ttc);
    }
  }

  return { fbc, ttc };
}

function normalizeEmailForTracking(email?: string): string | null {
  if (!email) return null;

  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizePhoneForTracking(phone?: string): string | null {
  if (!phone) return null;

  const normalized = phone.replace(/\D/g, '');
  return normalized.length > 0 ? normalized : null;
}

function normalizeNamePartsForTracking(name?: string): { firstName: string | null; lastName: string | null } {
  if (!name) {
    return { firstName: null, lastName: null };
  }

  const normalizedName = name.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!normalizedName) {
    return { firstName: null, lastName: null };
  }

  const [firstName = '', ...lastNameParts] = normalizedName.split(' ');
  const lastName = lastNameParts.join(' ').trim();

  return {
    firstName: firstName || null,
    lastName: lastName || null,
  };
}

async function sha256Hash(value: string): Promise<string> {
  const encodedValue = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encodedValue);
  const hashBytes = Array.from(new Uint8Array(digest));

  return hashBytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function prepareLeadUserData(userData: InitialLeadUserData): Promise<PreparedLeadUserData> {
  const normalizedEmail = normalizeEmailForTracking(userData.email);
  const normalizedPhone = normalizePhoneForTracking(userData.phone);
  const normalizedName = normalizeNamePartsForTracking(userData.name);

  if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
    return {
      email: normalizedEmail ?? undefined,
      phone: normalizedPhone ?? undefined,
      firstName: normalizedName.firstName ?? undefined,
      lastName: normalizedName.lastName ?? undefined,
    };
  }

  const [email, phone, firstName, lastName] = await Promise.all([
    normalizedEmail ? sha256Hash(normalizedEmail) : Promise.resolve(undefined),
    normalizedPhone ? sha256Hash(normalizedPhone) : Promise.resolve(undefined),
    normalizedName.firstName ? sha256Hash(normalizedName.firstName) : Promise.resolve(undefined),
    normalizedName.lastName ? sha256Hash(normalizedName.lastName) : Promise.resolve(undefined),
  ]);

  return {
    email,
    phone,
    firstName,
    lastName,
  };
}

async function trackInitialLead(userData: InitialLeadUserData): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const preparedUserData = await prepareLeadUserData(userData);
  const metaPixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();

  if (typeof window.fbq === 'function') {
    if (metaPixelId && (preparedUserData.email || preparedUserData.phone || preparedUserData.firstName || preparedUserData.lastName)) {
      window.fbq('init', metaPixelId, {
        ...(preparedUserData.email ? { em: preparedUserData.email } : {}),
        ...(preparedUserData.phone ? { ph: preparedUserData.phone } : {}),
        ...(preparedUserData.firstName ? { fn: preparedUserData.firstName } : {}),
        ...(preparedUserData.lastName ? { ln: preparedUserData.lastName } : {}),
      });
    }

    window.fbq('track', 'CompleteRegistration', QUALIFIED_LEAD_TRACKING_PARAMS);
  }

  if (window.ttq?.identify && (preparedUserData.email || preparedUserData.phone)) {
    window.ttq.identify({
      ...(preparedUserData.email ? { email: preparedUserData.email } : {}),
      ...(preparedUserData.phone ? { phone_number: preparedUserData.phone } : {}),
    });
  }

  window.ttq?.track?.('CompleteRegistration', QUALIFIED_LEAD_TRACKING_PARAMS);
}

function getOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): { value: string; label: string } | null {
  const match = options.find((option) => option.value === value);
  return match ? { value: match.value, label: match.label } : null;
}

function calculateQualification(answers: Answers): QualificationSummary {
  const teamSize = TEAM_SIZE_OPTIONS.find((option) => option.value === answers.teamSize);
  const consistentSales = CONSISTENT_SALES_OPTIONS.find((option) => option.value === answers.consistentSales);
  const adSpend = AD_SPEND_OPTIONS.find((option) => option.value === answers.adSpend);
  const investmentCoverage = INVESTMENT_COVERAGE_OPTIONS.find((option) => option.value === answers.investmentCoverage);
  const leadResponse = LEAD_RESPONSE_OPTIONS.find((option) => option.value === answers.leadResponseCapability);
  const urgency = URGENCY_OPTIONS.find((option) => option.value === answers.urgency);
  const purchaseDecision = PURCHASE_DECISION_OPTIONS.find((option) => option.value === answers.purchaseDecision);
  const investmentPosition = INVESTMENT_POSITION_OPTIONS.find((option) => option.value === answers.investmentPosition);

  const leadSourceScore = answers.leadSources.includes('paid_ads') ? 10 : 0;

  const scoreTotal =
    (teamSize?.score ?? 0) +
    (consistentSales?.score ?? 0) +
    (adSpend?.score ?? 0) +
    (investmentCoverage?.score ?? 0) +
    leadSourceScore +
    (leadResponse?.score ?? 0) +
    (urgency?.score ?? 0) +
    (purchaseDecision?.score ?? 0) +
    (investmentPosition?.score ?? 0);

  const autorejectTriggered = Boolean(
    teamSize?.autoReject || adSpend?.autoReject || urgency?.autoReject || investmentPosition?.autoReject,
  );

  let finalStatus: FinalStatus = 'rechazado';

  if (scoreTotal >= 70 && !autorejectTriggered && answers.purchaseDecision !== 'no') {
    finalStatus = 'calificado_llamada';
  } else if (((scoreTotal >= 40 && scoreTotal < 70) || answers.purchaseDecision === 'no') && !autorejectTriggered) {
    finalStatus = 'sesion_pagada';
  }

  return {
    scoreTotal,
    autorejectTriggered,
    finalStatus,
  };
}

const buildPayload = ({
  answers,
  visitorData,
}: {
  answers: Answers;
  visitorData: VisitorData | null;
}): LeadflowPayload => {
  const { scoreTotal, autorejectTriggered, finalStatus } = calculateQualification(answers);
  const selectedCountry = answers.country || normalizeCountry(visitorData?.country_code);
  const email = answers.email.trim().toLowerCase();
  const telefono = answers.whatsapp.trim();
  const nombreCompleto = answers.fullName.trim();
  const { fbc, ttc } = captureTrackingClickIds();

  return {
    email,
    telefono,
    nombre_completo: nombreCompleto,
    fbc,
    ttc,
    respuestas: {
      tamano_equipo: getOptionLabel(TEAM_SIZE_OPTIONS, answers.teamSize),
      compania_producto: answers.companyProduct.trim(),
      ventas_consistentes: getOptionLabel(CONSISTENT_SALES_OPTIONS, answers.consistentSales),
      principal_problema: answers.mainProblem.trim(),
      inversion_ads: getOptionLabel(AD_SPEND_OPTIONS, answers.adSpend),
      quien_cubre_inversion: getOptionLabel(INVESTMENT_COVERAGE_OPTIONS, answers.investmentCoverage),
      generacion_de_leads: answers.leadSources
        .map((value) => getOptionLabel(LEAD_SOURCE_OPTIONS, value))
        .filter((item): item is { value: string; label: string } => Boolean(item)),
      respuesta_de_leads: getOptionLabel(LEAD_RESPONSE_OPTIONS, answers.leadResponseCapability),
      urgencia: getOptionLabel(URGENCY_OPTIONS, answers.urgency),
      motivacion_actual: answers.whyNow.trim(),
      decision_de_compra: getOptionLabel(PURCHASE_DECISION_OPTIONS, answers.purchaseDecision),
      posicion_frente_a_inversion: getOptionLabel(INVESTMENT_POSITION_OPTIONS, answers.investmentPosition),
      contacto: {
        nombre_completo: nombreCompleto,
        whatsapp: telefono,
        email,
        pais: {
          code: selectedCountry,
          label: COUNTRY_LABELS.get(selectedCountry) ?? resolveCountryLabel(selectedCountry),
        },
      },
    },
    score_total: scoreTotal,
    autoreject_triggered: autorejectTriggered,
    final_status: finalStatus,
  };
};

function validateStep(
  step: number,
  answers: Answers,
  isWhatsappValid: boolean,
): FieldErrors {
  const nextErrors: FieldErrors = {};

  switch (step) {
    case 1:
      if (!answers.teamSize) nextErrors.teamSize = 'Este campo es obligatorio';
      break;
    case 2:
      if (!answers.companyProduct.trim()) nextErrors.companyProduct = 'Este campo es obligatorio';
      break;
    case 3:
      if (!answers.consistentSales) nextErrors.consistentSales = 'Este campo es obligatorio';
      break;
    case 4:
      if (!answers.mainProblem.trim()) {
        nextErrors.mainProblem = 'Este campo es obligatorio';
      } else if (answers.mainProblem.trim().length < MIN_TEXTAREA_LENGTH) {
        nextErrors.mainProblem = 'Escribe al menos 20 caracteres';
      }
      break;
    case 5:
      if (!answers.adSpend) nextErrors.adSpend = 'Este campo es obligatorio';
      break;
    case 6:
      if (!answers.investmentCoverage) nextErrors.investmentCoverage = 'Este campo es obligatorio';
      break;
    case 7:
      if (answers.leadSources.length === 0) nextErrors.leadSources = 'Selecciona al menos una opción';
      break;
    case 8:
      if (!answers.leadResponseCapability) nextErrors.leadResponseCapability = 'Este campo es obligatorio';
      break;
    case 9:
      if (!answers.urgency) nextErrors.urgency = 'Este campo es obligatorio';
      break;
    case 10:
      if (!answers.whyNow.trim()) {
        nextErrors.whyNow = 'Este campo es obligatorio';
      } else if (answers.whyNow.trim().length < MIN_TEXTAREA_LENGTH) {
        nextErrors.whyNow = 'Escribe al menos 20 caracteres';
      }
      break;
    case 11:
      if (!answers.purchaseDecision) nextErrors.purchaseDecision = 'Este campo es obligatorio';
      break;
    case 12:
      if (!answers.investmentPosition) nextErrors.investmentPosition = 'Este campo es obligatorio';
      break;
    case 13:
      if (!answers.fullName.trim()) nextErrors.fullName = 'Este campo es obligatorio';
      if (!answers.whatsapp.trim()) {
        nextErrors.whatsapp = 'Este campo es obligatorio';
      } else if (!safeValidatePhone(answers.whatsapp) || !isWhatsappValid) {
        nextErrors.whatsapp = 'Ingresa un WhatsApp válido';
      }
      if (!answers.email.trim()) {
        nextErrors.email = 'Este campo es obligatorio';
      } else if (!EMAIL_REGEX.test(answers.email.trim())) {
        nextErrors.email = 'Ingresa un email válido';
      }
      if (!answers.country) nextErrors.country = 'Selecciona un país';
      break;
    default:
      break;
  }

  return nextErrors;
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs text-red-400">{message}</p>;
}

function OptionButton({ label, description, selected, onClick, multiSelect = false }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]',
        selected
          ? 'border-cyan-400/70 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.14)]'
          : 'border-white/10 bg-white/[0.03]',
      ].join(' ')}
    >
      <div
        className={[
          'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200',
          selected ? 'border-cyan-300 bg-cyan-400/20 text-cyan-200' : 'border-white/20 bg-black/30 text-transparent',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : multiSelect ? <div className="h-2 w-2 rounded-sm border border-white/20" /> : null}
      </div>

      <div className="flex-1">
        <div className="text-sm font-semibold text-white sm:text-base">{label}</div>
        {description ? <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">{description}</p> : null}
      </div>
    </button>
  );
}

function CountrySelectField({ value, error, disabled = false, onChange }: CountrySelectFieldProps) {
  const selectedLabel = value ? COUNTRY_LABELS.get(value) ?? resolveCountryLabel(value) : 'Selecciona un país';
  const Flag = value ? (flags[value] as ComponentType<SVGProps<SVGSVGElement>> | undefined) : undefined;

  return (
    <div className="w-full max-w-full min-w-0 box-border">
      <label className="mb-2 block text-sm font-medium text-slate-200">
        País
        <span className="ml-1 text-red-500">*</span>
      </label>

      <div className="relative w-full max-w-full min-w-0">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as Country)}
          disabled={disabled}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
          style={{ colorScheme: 'dark' }}
          aria-label="Seleccionar país"
        >
          {ALLOWED_COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {COUNTRY_LABELS.get(country) ?? country}
            </option>
          ))}
        </select>

        <div
          className={[
            'flex min-h-[48px] items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-200',
            error
              ? 'border-red-500 bg-red-500/5'
              : 'border-white/10 bg-white/[0.03] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]',
            disabled ? 'opacity-60' : '',
          ].join(' ')}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
            {Flag ? <Flag className="h-4.5 w-6 rounded-sm shadow-sm" title={selectedLabel} /> : <span className="text-sm text-slate-300">--</span>}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">País</p>
            <p className="truncate text-sm font-medium text-white sm:text-base">{selectedLabel}</p>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>

      <InlineError message={error} />
    </div>
  );
}

const renderAIText = (text: string | null) => {
  if (!text) return null;

  return text.split('\n').map((paragraph, pIndex) => {
    if (!paragraph.trim()) return null;

    return (
      <p key={pIndex} className="mb-4 text-slate-300 text-base md:text-lg leading-relaxed">
        {paragraph.split('**').map((chunk, cIndex) => {
          if (cIndex % 2 === 1) {
            return (
              <span key={cIndex} className="font-bold text-white tracking-wide">
                {chunk}
              </span>
            );
          }

          return chunk;
        })}
      </p>
    );
  });
};

export function LeadflowApplicationForm({
  className = '',
  onPayloadReady,
}: LeadflowApplicationFormProps) {
  const { visitorData, isLoading: isVisitorLoading } = useVisitor();

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [selectedCountry, setSelectedCountry] = useState<Country>(FALLBACK_COUNTRY);
  const [isWhatsappValid, setIsWhatsappValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [submissionError, setSubmissionError] = useState('');
  const [lastPayload, setLastPayload] = useState<LeadflowPayload | null>(null);

  const hasManualCountrySelectionRef = useRef(false);

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
    captureTrackingClickIds();
  }, []);

  useEffect(() => {
    setAnswers((prev) => {
      if (prev.country === selectedCountry) return prev;
      return {
        ...prev,
        country: selectedCountry,
      };
    });
  }, [selectedCountry]);

  const progressPercentage = useMemo(() => Math.round((currentStep / TOTAL_STEPS) * 100), [currentStep]);
  const currentMeta = STEP_META[currentStep - 1] ?? STEP_META[0];
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
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    });
  };

  const handleAutoAdvanceSelection = (key: AutoAdvanceKey, value: string) => {
    updateAnswer(key, value);

    startTransition(() => {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    });
  };

  const toggleLeadSource = (value: string) => {
    setAnswers((prev) => {
      const currentValues = prev.leadSources;
      const hasValue = currentValues.includes(value);

      let nextValues: string[];

      if (value === 'no_system') {
        nextValues = hasValue ? [] : ['no_system'];
      } else if (hasValue) {
        nextValues = currentValues.filter((item) => item !== value);
      } else {
        nextValues = [...currentValues.filter((item) => item !== 'no_system'), value];
      }

      return {
        ...prev,
        leadSources: nextValues,
      };
    });

    setErrors((prev) => ({
      ...prev,
      leadSources: undefined,
    }));
    setSubmissionError('');
  };

  const handleCountrySelection = (country: Country) => {
    hasManualCountrySelectionRef.current = true;
    setSelectedCountry(country);
    setErrors((prev) => ({
      ...prev,
      country: undefined,
    }));
    setSubmissionError('');
  };

  const handleFinalSubmission = async () => {
    const stepErrors = validateStep(13, answers, isWhatsappValid);

    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({
        ...prev,
        ...stepErrors,
      }));
      return;
    }

    setIsSubmitting(true);
    setIsAnalyzing(true);
    setAiResponse(null);
    setSubmissionError('');

    const payload = buildPayload({
      answers: {
        ...answers,
        country: answers.country || selectedCountry,
      },
      visitorData,
    });

    console.log('[LeadflowApplicationForm payload]', payload);

    let finalPayload = payload;
    let nextAiResponse: string | null = null;

    try {
      const minimumAnalysisDelay = new Promise((resolve) => {
        window.setTimeout(resolve, 3500);
      });

      const aiEvaluationPromise = fetch('https://webhooks.kuruk.in/webhook/leadflow-eval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Leadflow AI webhook failed with status ${response.status}`);
          }

          return (await response.json()) as LeadflowAiWebhookResponse;
        })
        .catch((error) => {
          console.error('[LeadflowApplicationForm] AI evaluation failed', error);
          return null;
        });

      const [aiEvaluation] = await Promise.all([aiEvaluationPromise, minimumAnalysisDelay]);

      if (aiEvaluation?.es_valido === false) {
        finalPayload = {
          ...payload,
          final_status: 'rechazado',
        };
      }

      if (aiEvaluation?.es_valido === true && QUALIFIED_FINAL_STATUSES.has(finalPayload.final_status)) {
        void trackInitialLead({
          email: payload.respuestas.contacto.email,
          phone: payload.respuestas.contacto.whatsapp,
          name: payload.respuestas.contacto.nombre_completo,
        }).catch((error) => {
          console.error('[LeadflowApplicationForm] initial lead tracking failed', error);
        });
      }

      nextAiResponse =
        typeof aiEvaluation?.ai_consulting_text === 'string' && aiEvaluation.ai_consulting_text.trim().length > 0
          ? aiEvaluation.ai_consulting_text.trim()
          : null;
    } catch (error) {
      console.error('[LeadflowApplicationForm] submission failed', error);
      nextAiResponse = null;
    }

    try {
      await onPayloadReady?.(finalPayload);
    } catch (error) {
      console.error('[LeadflowApplicationForm] onPayloadReady failed', error);
    } finally {
      setAiResponse(nextAiResponse);
      setLastPayload(finalPayload);

      startTransition(() => {
        setCurrentStep(TOTAL_STEPS);
      });

      setIsAnalyzing(false);
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
    <div className="w-full max-w-full min-w-0 box-border">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-200">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[
          'h-12 w-full rounded-xl border bg-white/[0.03] px-4 text-sm text-white outline-none transition-all duration-200 sm:text-base',
          'placeholder:text-slate-500 focus:border-cyan-400 focus:shadow-[0_0_18px_rgba(34,211,238,0.14)]',
          error ? 'border-red-500' : 'border-white/10',
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
    <div className="w-full max-w-full min-w-0 box-border">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-200">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className={[
          'w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition-all duration-200 sm:text-base',
          'placeholder:text-slate-500 focus:border-cyan-400 focus:shadow-[0_0_18px_rgba(34,211,238,0.14)]',
          error ? 'border-red-500' : 'border-white/10',
        ].join(' ')}
      />
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <InlineError message={error} />
        <span className="text-xs text-slate-500">{value.trim().length}/{MIN_TEXTAREA_LENGTH}+ mínimo</span>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid gap-3">
            {TEAM_SIZE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={answers.teamSize === option.value}
                onClick={() => handleAutoAdvanceSelection('teamSize', option.value)}
              />
            ))}
            <InlineError message={errors.teamSize} />
          </div>
        );
      case 2:
        return renderTextInput({
          id: 'companyProduct',
          label: 'Compañía / producto',
          value: answers.companyProduct,
          placeholder: 'Ej. Red de bienestar con productos de consumo mensual',
          onChange: (value) => updateAnswer('companyProduct', value),
          error: errors.companyProduct,
        });
      case 3:
        return (
          <div className="grid gap-3">
            {CONSISTENT_SALES_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={answers.consistentSales === option.value}
                onClick={() => handleAutoAdvanceSelection('consistentSales', option.value)}
              />
            ))}
            <InlineError message={errors.consistentSales} />
          </div>
        );
      case 4:
        return renderTextarea({
          id: 'mainProblem',
          label: 'Principal problema',
          value: answers.mainProblem,
          placeholder: 'Describe con detalle qué está frenando hoy el crecimiento del equipo...',
          onChange: (value) => updateAnswer('mainProblem', value),
          error: errors.mainProblem,
        });
      case 5:
        return (
          <div className="grid gap-3">
            {AD_SPEND_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={answers.adSpend === option.value}
                onClick={() => handleAutoAdvanceSelection('adSpend', option.value)}
              />
            ))}
            <InlineError message={errors.adSpend} />
          </div>
        );
      case 6:
        return (
          <div className="grid gap-3">
            {INVESTMENT_COVERAGE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={answers.investmentCoverage === option.value}
                onClick={() => handleAutoAdvanceSelection('investmentCoverage', option.value)}
              />
            ))}
            <InlineError message={errors.investmentCoverage} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="grid gap-3">
              {LEAD_SOURCE_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  selected={answers.leadSources.includes(option.value)}
                  onClick={() => toggleLeadSource(option.value)}
                  multiSelect
                />
              ))}
            </div>
            <InlineError message={errors.leadSources} />
          </div>
        );
      case 8:
        return (
          <div className="grid gap-3">
            {LEAD_RESPONSE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={answers.leadResponseCapability === option.value}
                onClick={() => handleAutoAdvanceSelection('leadResponseCapability', option.value)}
              />
            ))}
            <InlineError message={errors.leadResponseCapability} />
          </div>
        );
      case 9:
        return (
          <div className="grid gap-3">
            {URGENCY_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={answers.urgency === option.value}
                onClick={() => handleAutoAdvanceSelection('urgency', option.value)}
              />
            ))}
            <InlineError message={errors.urgency} />
          </div>
        );
      case 10:
        return renderTextarea({
          id: 'whyNow',
          label: 'Motivación: ¿por qué ahora?',
          value: answers.whyNow,
          placeholder: 'Cuéntanos qué cambió y por qué resolverlo ahora sí importa...',
          onChange: (value) => updateAnswer('whyNow', value),
          error: errors.whyNow,
        });
      case 11:
        return (
          <div className="grid gap-3">
            {PURCHASE_DECISION_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={answers.purchaseDecision === option.value}
                onClick={() => handleAutoAdvanceSelection('purchaseDecision', option.value)}
              />
            ))}
            <InlineError message={errors.purchaseDecision} />
          </div>
        );
      case 12:
        return (
          <div className="grid gap-3">
            {INVESTMENT_POSITION_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={answers.investmentPosition === option.value}
                onClick={() => handleAutoAdvanceSelection('investmentPosition', option.value)}
              />
            ))}
            <InlineError message={errors.investmentPosition} />
          </div>
        );
      case 13:
        return (
          <div className="w-full max-w-full min-w-0 box-border space-y-4">
            <div className="grid w-full max-w-full min-w-0 box-border gap-4 md:grid-cols-2">
              {renderTextInput({
                id: 'fullName',
                label: 'Nombre completo',
                value: answers.fullName,
                placeholder: 'Tu nombre y apellido',
                onChange: (value) => updateAnswer('fullName', value),
                error: errors.fullName,
              })}

              <CountrySelectField
                value={answers.country || selectedCountry}
                onChange={handleCountrySelection}
                error={errors.country}
                disabled={isVisitorLoading}
              />

              <div className="w-full max-w-full min-w-0 box-border md:col-span-2">
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
                  className="w-full max-w-full min-w-0 box-border"
                />
              </div>

              {renderTextInput({
                id: 'email',
                label: 'Email',
                value: answers.email,
                placeholder: 'tu@email.com',
                onChange: (value) => updateAnswer('email', value),
                error: errors.email,
                type: 'email',
              })}
            </div>

            {isVisitorLoading ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-400 sm:text-sm">
                Detectando país por IP para precargar la bandera y el prefijo...
              </div>
            ) : null}

            {submissionError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 sm:text-sm">
                {submissionError}
              </div>
            ) : null}
          </div>
        );
      default:
        return null;
    }
  };

  const isAutoAdvanceStep = AUTO_ADVANCE_STEPS.has(currentStep);
  const shouldShowNextButton = !isAutoAdvanceStep && currentStep < TOTAL_STEPS;
  const waNumber = (import.meta.env.VITE_LEADFLOW_WHATSAPP_NUMBER || '59179790873').replace(/\D/g, '');
  const whatsappScheduleMessage = encodeURIComponent(
    'Hola, acabo de completar mi evaluación para Leadflow. Me gustaría agendar mi llamada.',
  );
  const whatsappScheduleUrl = `https://wa.me/${waNumber}?text=${whatsappScheduleMessage}`;
  const isSuccessfulResult =
    Boolean(lastPayload) && (lastPayload?.final_status === 'calificado_llamada' || lastPayload?.final_status === 'sesion_pagada');

  useEffect(() => {
    if (!isSuccessfulResult || isAnalyzing) {
      setCountdown(30);
      return;
    }

    setCountdown(30);

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = whatsappScheduleUrl;
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isAnalyzing, isSuccessfulResult, whatsappScheduleUrl]);

  const resultConfig = {
    calificado_llamada: {
      eyebrow: 'Resultado A',
      title: 'Tu perfil encaja perfectamente.',
      actionLabel: 'Agendar por WhatsApp',
      actionHref: whatsappScheduleUrl,
      icon: CalendarDays,
    },
    sesion_pagada: {
      eyebrow: 'Resultado B',
      title: 'Hay potencial, pero primero hace falta diagnóstico serio.',
      actionLabel: 'Agendar por WhatsApp',
      actionHref: whatsappScheduleUrl,
      icon: CircleDollarSign,
    },
    rechazado: {
      eyebrow: 'Resultado C',
      title: 'Por ahora no eres candidato para Leadflow.',
      actionLabel: '',
      actionHref: '',
      icon: ShieldAlert,
    },
  } as const;

  const shouldShowResult = Boolean(lastPayload);
  const isResultScreen = shouldShowResult && !isAnalyzing;
  const activeResult = lastPayload ? resultConfig[lastPayload.final_status] : null;
  const ResultIcon = activeResult?.icon;
  const resultFallbackText =
    lastPayload?.final_status === 'calificado_llamada'
      ? 'Tu evaluación fue aprobada. Tu operación muestra señales claras para avanzar a una conversación estratégica sobre la implementación de Leadflow.'
      : lastPayload?.final_status === 'sesion_pagada'
        ? 'Tu operación tiene potencial, pero antes de implementar Leadflow conviene realizar un diagnóstico estratégico para ordenar los bloqueos principales.'
        : 'Por ahora tu operación todavía no cumple las condiciones para implementar Leadflow. Cuando consolides tracción y capacidad de inversión, podremos reevaluarlo.';
  const advanceButtonClassName = [
    'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-cyan-400/30',
    'bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.6)]',
    'animate-pulse transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(34,211,238,0.28)]',
    'sm:bg-gradient-to-r sm:from-cyan-500 sm:to-blue-600',
  ].join(' ');
  const backButtonClassName = [
    'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10',
    'bg-transparent px-4 py-3 text-sm font-medium text-slate-300 transition-colors duration-200',
    'hover:border-white/20 hover:bg-white/[0.04] hover:text-white',
  ].join(' ');

  return (
    <section
      className={[
        'relative w-full bg-[#050505] text-white',
        isResultScreen ? 'h-auto overflow-visible' : 'h-full overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_25%)]" />

      <div className={['relative w-full', isResultScreen ? 'h-auto' : 'h-full'].join(' ')}>
        <div
          className={[
            'flex w-full flex-col bg-[#0a0a0a] sm:rounded-2xl sm:border border-white/10',
            isResultScreen ? 'h-auto overflow-visible' : 'h-full overflow-hidden',
          ].join(' ')}
        >
          <header className="shrink-0 p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
                {isAnalyzing ? 'Analizando' : shouldShowResult ? 'Resultado final' : `Paso ${currentStep} de ${TOTAL_STEPS}`}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_18px_rgba(34,211,238,0.45)] transition-all duration-300"
                  style={{ width: `${isAnalyzing || shouldShowResult ? 100 : progressPercentage}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] font-medium text-slate-500">
                {isAnalyzing || shouldShowResult ? '100%' : `${progressPercentage}%`}
              </span>
            </div>
          </header>

          <div
            className={[
              'p-4 sm:p-6 pb-12',
              isResultScreen
                ? 'h-auto overflow-y-auto sm:overflow-visible max-h-[calc(100dvh-76px)] sm:max-h-none'
                : 'flex-1 min-h-0 overflow-y-auto',
            ].join(' ')}
          >
            {isAnalyzing ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
                </div>
                <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300">
                  Análisis profundo
                </p>
                <h2 className="mt-3 text-xl font-bold leading-tight text-white sm:text-2xl">
                  Analizando viabilidad de tu operación...
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
                  Evaluando respuestas con nuestro sistema de IA...
                </p>
                <div className="mt-6 flex items-center gap-2 text-cyan-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:240ms]" />
                </div>
              </div>
            ) : shouldShowResult && activeResult && ResultIcon ? (
              <div className="w-full max-w-full min-w-0 box-border space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.16)]">
                  <ResultIcon className="h-6 w-6" />
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  {activeResult.eyebrow}
                </p>
                <h2 className="text-xl md:text-2xl font-bold leading-tight text-white">{activeResult.title}</h2>
                <div className="max-w-2xl">
                  {renderAIText(aiResponse) || renderAIText(resultFallbackText)}
                </div>

                {isSuccessfulResult ? (
                  <div className="relative mt-10 mb-8 rounded-2xl border border-amber-500/20 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-sm">
                    <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                    <h3 className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      Acceso Prioritario
                    </h3>

                    <p className="mb-6 text-lg font-light leading-relaxed text-slate-300">
                      Trabajamos exclusivamente con <span className="font-semibold text-white">5 equipos al mes</span>.
                      Actualmente, la agenda de abril tiene{' '}
                      <span className="font-bold text-amber-400">1 único espacio disponible</span>.
                    </p>

                    <div className="group relative mx-auto my-6 w-full max-w-md">
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 blur opacity-50 transition duration-500 animate-pulse group-hover:opacity-100" />
                      <a
                        href={whatsappScheduleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-8 py-4 text-lg font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:bg-slate-900 active:scale-95"
                      >
                        <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        AGENDAR LLAMADA AHORA
                      </a>
                    </div>

                    <p className="mt-6 text-center font-mono text-sm tracking-widest text-slate-500">
                      Redirección automática en <span className="font-bold text-amber-500">{countdown}</span>s
                    </p>
                  </div>
                ) : null}

                {activeResult.actionHref && !isSuccessfulResult ? (
                  <a
                    href={activeResult.actionHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(34,211,238,0.28)] sm:w-auto sm:bg-gradient-to-r sm:from-cyan-500 sm:to-blue-600"
                  >
                    <span>{activeResult.actionLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}

                {import.meta.env.DEV && lastPayload ? (
                  <details className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <summary className="cursor-pointer text-sm font-medium text-slate-300">Payload de desarrollo</summary>
                    <pre className="mt-3 overflow-x-auto text-xs leading-relaxed text-slate-400">
                      {JSON.stringify(lastPayload, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : (
              <div className="w-full max-w-full min-w-0 box-border space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                    {currentMeta.eyebrow}
                  </p>
                  <h2 className="text-xl md:text-2xl font-bold leading-tight text-white">{currentMeta.title}</h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-400">{currentMeta.description}</p>
                </div>

                <div className="space-y-4">
                  {renderStepContent()}
                  {isAutoAdvanceStep ? (
                    <p className="text-xs text-slate-500">Selecciona una opción para avanzar automáticamente.</p>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {!shouldShowResult && !isAnalyzing ? (
            <footer className="shrink-0 p-4 border-t border-white/10 bg-[#0a0a0a] flex justify-between items-center pb-safe">
              <div className="flex w-full items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <button type="button" onClick={goToPreviousStep} className={backButtonClassName}>
                    <ArrowLeft className="h-4 w-4" />
                    <span>Atrás</span>
                  </button>
                ) : (
                  <div className="w-16 sm:w-24" aria-hidden="true" />
                )}

                {shouldShowNextButton ? (
                  <button type="button" onClick={goToNextStep} className={`${advanceButtonClassName} min-w-0 flex-1 sm:flex-none`}>
                    <span>Continuar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : null}

                {currentStep === TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={() => void handleFinalSubmission()}
                    disabled={isSubmitting}
                    className={`${advanceButtonClassName} min-w-0 flex-1 sm:flex-none disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar solicitud</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </footer>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default LeadflowApplicationForm;
