import nl from './translations/nl';
import en from './translations/en';
import de from './translations/de';

export type Locale = 'nl' | 'en' | 'de';

const translations: Record<Locale, typeof nl> = { nl, en, de };

function getNestedValue(obj: any, key: string): any {
  return key.split('.').reduce((o, k) => o?.[k], obj);
}

export function useTranslations(locale: string | undefined) {
  const l = (locale || 'nl') as Locale;
  const dict = translations[l];
  return (key: string) => getNestedValue(dict, key);
}

export function localePath(locale: string | undefined, path: string): string {
  const l = locale || 'nl';
  if (l === 'nl') return path;
  return `/${l}${path}`;
}

export const localeMap: Record<Locale, { label: string; ogLocale: string }> = {
  nl: { label: 'NL', ogLocale: 'nl_NL' },
  en: { label: 'EN', ogLocale: 'en_US' },
  de: { label: 'DE', ogLocale: 'de_DE' },
};

export const locales: Locale[] = ['nl', 'en', 'de'];
