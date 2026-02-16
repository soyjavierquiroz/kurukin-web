import { FormEvent, useMemo, useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { SmartPhoneInput } from '../components/SmartPhoneInput';
import { useVisitor } from '../context/VisitorContext';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface WebhookPayload {
  lead: {
    nombre: string;
    apellido: string;
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

function safeValidatePhone(value: string): boolean {
  if (!value.trim()) return false;

  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

export function ContactForm() {
  const { visitorData } = useVisitor();

  const [firstName, setFirstName] = useState('Javier');
  const [lastName, setLastName] = useState('Quiroz');
  const [phone, setPhone] = useState('');
  const [phoneIsValidFromComponent, setPhoneIsValidFromComponent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPayload, setLastPayload] = useState<WebhookPayload | null>(null);

  const isE164 = phone.startsWith('+');
  const isValidWithLib = useMemo(() => safeValidatePhone(phone), [phone]);

  const canSubmit = useMemo(() => {
    return (
      !isSubmitting &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      phoneIsValidFromComponent &&
      isValidWithLib &&
      isE164
    );
  }, [firstName, isSubmitting, isValidWithLib, isE164, lastName, phoneIsValidFromComponent]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!firstName.trim()) {
      nextErrors.firstName = 'Completa este campo.';
    }

    if (!lastName.trim()) {
      nextErrors.lastName = 'Completa este campo.';
    }

    if (!phone.trim()) {
      nextErrors.phone = 'Por favor, ingresa tu número de WhatsApp.';
    } else if (!isE164) {
      nextErrors.phone = 'El valor debe incluir prefijo internacional (E.164), por ejemplo +59179790873.';
    } else if (!isValidWithLib || !phoneIsValidFromComponent) {
      nextErrors.phone = 'Por favor, ingresa un número de WhatsApp válido.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const payload: WebhookPayload = {
      lead: {
        nombre: firstName.trim(),
        apellido: lastName.trim(),
        whatsapp: phone,
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
        window.setTimeout(resolve, 600);
      });

      // Simula el envío al webhook.
      console.log(payload);
      setLastPayload(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <section className="mx-auto w-full max-w-5xl rounded-xl border border-slate-300 bg-white p-5 shadow-sm md:p-6">
        <h1 className="text-3xl font-semibold text-slate-900">Probar Formulario (Nombre, Apellido, WhatsApp)</h1>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Instrucciones precisas de verificación</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>En el selector de país, confirma Bolivia (+591).</li>
            <li>Escribe exactamente: 79790873.</li>
            <li>Revisa que el panel de depuración muestre: +59179790873.</li>
            <li>Confirma que ambos indicadores de validez estén en true.</li>
            <li>Haz clic en "Validar y Enviar" y revisa el payload final.</li>
          </ol>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-800">
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                className={[
                  'h-11 w-full rounded-md border bg-slate-100 px-4 text-lg text-slate-900',
                  'focus:outline-none focus:ring-2',
                  errors.firstName
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20',
                ].join(' ')}
              />
              {errors.firstName ? <p className="mt-2 text-sm text-red-600">{errors.firstName}</p> : null}
            </div>

            <div>
              <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-800">
                Apellido
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                className={[
                  'h-11 w-full rounded-md border bg-slate-100 px-4 text-lg text-slate-900',
                  'focus:outline-none focus:ring-2',
                  errors.lastName
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20',
                ].join(' ')}
              />
              {errors.lastName ? <p className="mt-2 text-sm text-red-600">{errors.lastName}</p> : null}
            </div>
          </div>

          <div>
            <SmartPhoneInput
              id="whatsapp"
              name="whatsapp"
              label="Número de WhatsApp"
              value={phone}
              onChange={(nextValue) => {
                setPhone(nextValue);
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              onValidityChange={setPhoneIsValidFromComponent}
              error={errors.phone}
              required
              defaultCountry="BO"
              autoDetectCountry
              placeholder="79790873"
            />
          </div>

          {errors.phone ? (
            <div className="rounded-md border-l-4 border-red-500 bg-red-50 p-4 text-red-700">{errors.phone}</div>
          ) : null}

          <input type="hidden" name="visitor_ip" value={visitorData?.ip || ''} />
          <input type="hidden" name="visitor_city" value={visitorData?.city || ''} />
          <input type="hidden" name="visitor_country_name" value={visitorData?.country_name || ''} />
          <input type="hidden" name="visitor_timezone" value={visitorData?.timezone || ''} />
          <input type="hidden" name="visitor_currency" value={visitorData?.currency || ''} />

          <div className="border-t border-slate-200 pt-4">
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-14 rounded-xl bg-blue-600 px-10 text-3xl font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Validar y Enviar'}
            </button>
          </div>
        </form>

        <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Panel de depuración</h2>
          <pre className="mt-2 overflow-x-auto text-xs text-slate-700">
{JSON.stringify(
  {
    phone_input_value: phone,
    expected_example: '+59179790873',
    starts_with_plus: isE164,
    valid_from_component: phoneIsValidFromComponent,
    valid_from_libphonenumber: isValidWithLib,
    visitor_data: visitorData,
  },
  null,
  2
)}
          </pre>
        </section>

        {lastPayload ? (
          <section className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Payload final enviado</p>
            <pre className="mt-2 overflow-x-auto text-xs text-emerald-900">{JSON.stringify(lastPayload, null, 2)}</pre>
          </section>
        ) : null}
      </section>
    </main>
  );
}

export default ContactForm;
