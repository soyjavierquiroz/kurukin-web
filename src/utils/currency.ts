export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'Dólares',
  EUR: 'Euros',
  BOB: 'Bolivianos',
  ARS: 'Pesos Argentinos',
  COP: 'Pesos Colombianos',
  MXN: 'Pesos Mexicanos',
  CLP: 'Pesos Chilenos',
  PEN: 'Soles',
  UYU: 'Pesos Uruguayos',
  PYG: 'Guaraníes',
  VES: 'Bolívares',
  CRC: 'Colones',
  DOP: 'Pesos Dominicanos',
  GTQ: 'Quetzales',
  CAD: 'Dólares Canadienses',
  GBP: 'Libras',
  JPY: 'Yenes',
};

function capitalizeFirstLetter(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getFriendlyCurrencyName(currencyCode: string): string {
  const normalizedCode = currencyCode.trim().toUpperCase();
  if (!normalizedCode) return currencyCode;

  const mappedCurrency = CURRENCY_NAMES[normalizedCode];
  if (mappedCurrency) {
    return mappedCurrency;
  }

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const displayNames = new Intl.DisplayNames(['es'], { type: 'currency' });
      const intlName = displayNames.of(normalizedCode);

      if (intlName) {
        return capitalizeFirstLetter(intlName);
      }
    }
  } catch {
    // Ignora errores de Intl y continúa con fallback final.
  }

  return normalizedCode;
}
