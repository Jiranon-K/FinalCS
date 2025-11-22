'use client';

import React, { createContext, useState, ReactNode } from 'react';
import th from './locales/th.json';
import en from './locales/en.json';

type Locale = 'th' | 'en';
type LocaleMessages = typeof th;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: LocaleMessages;
}

const locales = { th, en };

const getInitialLocale = (): Locale => {
  if (typeof window !== 'undefined') {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale === 'th' || savedLocale === 'en') {
      return savedLocale;
    }
  }
  return 'th';
};

export const LocaleContext = createContext<LocaleContextType>({
  locale: 'th',
  setLocale: () => {},
  t: th,
});

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  const value = {
    locale,
    setLocale,
    t: locales[locale],
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}
