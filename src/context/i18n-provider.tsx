
'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import en from '@/locales/en';
import hi from '@/locales/hi';
import bn from '@/locales/bn';
import ta from '@/locales/ta';
import te from '@/locales/te';
import mr from '@/locales/mr';
import pa from '@/locales/pa';
import gu from '@/locales/gu';
import kn from '@/locales/kn';

type I18nContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, values?: { [key: string]: string | number }) => string;
};

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: { [key: string]: { [key: string]: string } } = {
  en,
  hi,
  bn,
  ta,
  te,
  mr,
  pa,
  gu,
  kn,
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && translations[savedLocale]) {
      setLocaleState(savedLocale);
    }
  }, []);
  
  const setLocale = (newLocale: string) => {
    if (translations[newLocale]) {
      localStorage.setItem('locale', newLocale);
      setLocaleState(newLocale);
    }
  };

  const t = useCallback((key: string, values?: { [key: string]: string | number }): string => {
    const message = translations[locale]?.[key] || translations['en']?.[key] || key;
    if (!values) {
      return message;
    }
    return Object.entries(values).reduce((acc, [valueKey, value]) => {
        return acc.replace(new RegExp(`\\{${valueKey}\\}`, 'g'), String(value));
    }, message);
  }, [locale]);

  const value = { locale, setLocale, t };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

    
