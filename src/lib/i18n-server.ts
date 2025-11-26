import { NextRequest } from 'next/server';
import thTranslations from '@/i18n/locales/th.json';
import enTranslations from '@/i18n/locales/en.json';

export type Locale = 'th' | 'en';

const translations = {
  th: thTranslations,
  en: enTranslations,
};

export function getLocaleFromRequest(request: NextRequest): Locale {
  const localeCookie = request.cookies.get('locale')?.value;
  if (localeCookie === 'th' || localeCookie === 'en') {
    return localeCookie;
  }

  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    if (acceptLanguage.includes('th')) return 'th';
    if (acceptLanguage.includes('en')) return 'en';
  }

  return 'th';
}

export function getTranslations(locale: Locale) {
  return translations[locale];
}

export function getTranslation(locale: Locale, path: string, replacements?: Record<string, string>): string {
  const t = translations[locale];
  const keys = path.split('.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = t;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path;
    }
  }

  let result = typeof value === 'string' ? value : path;

  if (replacements) {
    Object.entries(replacements).forEach(([key, val]) => {
      result = result.replace(`{${key}}`, val);
    });
  }

  return result;
}

export function createServerTranslator(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = getTranslations(locale);

  return {
    locale,
    t,
    translate: (path: string, replacements?: Record<string, string>) =>
      getTranslation(locale, path, replacements),
  };
}
